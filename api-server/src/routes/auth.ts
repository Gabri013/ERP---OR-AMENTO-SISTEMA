import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "../lib/prisma";
import { LoginBody, LoginResponse } from "../schemas";
import {
  signRefreshToken,
  signUserToken,
  verifyRefreshToken,
  verifyUserToken,
} from "../lib/jwt";
import { response } from "../utils/response";
import { validateBody } from "../middleware/validateZod";
import { z } from "zod";

const router: IRouter = Router();

// RefreshToken delegate — added via migration, cast until `npm run db:generate` runs
/* eslint-disable-next-line */
const refreshTokenModel = (db as any).refreshToken as {
  create: Function;
  deleteMany: Function;
  findUnique: Function;
};

/**
 * POST /api/auth/login
 * Body: { email, senha }
 * Returns user profile + JWT token (replaces old session cookie)
 */
router.post("/auth/login", validateBody(LoginBody), async (req, res): Promise<void> => {
  const { email, senha } = req.body;

  const user = await db.usuario.findUnique({
    where: { email },
  });

  if (!user || user.status !== "ativo") {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const valid = await bcrypt.compare(senha, user.senha);
  if (!valid) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const claims = {
    sub: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo,
  };

  const token = await signUserToken(claims);
  const refreshToken = await signRefreshToken(claims);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await refreshTokenModel.create({
    data: { token: refreshToken, usuarioId: user.id, expiresAt },
  });

  // Also set httpOnly cookie for browser clients that prefer cookies
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  // Return both the profile (for existing clients) and the token
  const profile = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo,
    token,
    refreshToken,
  };

  res.json(response.success(profile));
});

/**
 * POST /api/auth/logout
 */
router.post("/auth/logout", validateBody(z.object({ refreshToken: z.string().optional() })), async (req, res): Promise<void> => {
  res.clearCookie("token", { path: "/" });
  const { refreshToken } = req.body;
  if (refreshToken) {
    await refreshTokenModel.deleteMany({ where: { token: refreshToken } });
  }
  res.json(response.success({ ok: true }));
});

/**
 * GET /api/auth/me
 * Auth via Authorization: Bearer <token> header OR httpOnly "token" cookie
 */
router.get("/auth/me", async (req, res): Promise<void> => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const claims = await verifyUserToken(token);
  if (!claims) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // Load fresh user (in case status changed)
  const user = await db.usuario.findUnique({
    where: { id: claims.sub },
    select: { id: true, nome: true, email: true, tipo: true, status: true },
  });

  if (!user || user.status !== "ativo") {
    res.status(401).json({ error: "User not found or inactive" });
    return;
  }

  res.json(
    response.success({
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
    }),
  );
});

router.post("/auth/refresh", validateBody(z.object({ refreshToken: z.string() })), async (req, res): Promise<void> => {
  const { refreshToken } = req.body;

  const claims = await verifyRefreshToken(refreshToken);
  if (!claims) {
    res
      .status(401)
      .json(response.error("Refresh token inválido", "INVALID_REFRESH_TOKEN"));
    return;
  }

  const storedToken = await refreshTokenModel.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    res
      .status(401)
      .json(
        response.error(
          "Refresh token expirado ou revogado",
          "REFRESH_TOKEN_REVOKED",
        ),
      );
    return;
  }

  const user = await db.usuario.findUnique({
    where: { id: claims.sub },
    select: { id: true, nome: true, email: true, tipo: true, status: true },
  });

  if (!user || user.status !== "ativo") {
    res
      .status(401)
      .json(
        response.error("Usuário não encontrado ou inativo", "USER_INACTIVE"),
      );
    return;
  }

  const nextClaims = {
    sub: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo,
  };
  const accessToken = await signUserToken(nextClaims);
  const nextRefreshToken = await signRefreshToken(nextClaims);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await refreshTokenModel.deleteMany({ where: { token: refreshToken } });
  await refreshTokenModel.create({
    data: { token: nextRefreshToken, usuarioId: user.id, expiresAt },
  });

  res.json(
    response.success({
      accessToken,
      refreshToken: nextRefreshToken,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
      },
    }),
  );
});

export default router;
