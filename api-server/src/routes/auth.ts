import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "../lib/prisma";
import { LoginBody, TwoFactorDisableBody, TwoFactorEnableBody } from "../schemas";
import {
  signRefreshToken,
  signUserToken,
  verifyRefreshToken,
  verifyUserToken,
} from "../lib/jwt";
import { response } from "../utils/response";
import { validateBody } from "../middleware/validateZod";
import { z } from "zod";
import { generateBackupCodes, generateTwoFactorSecret, verifyBackupCode, verifyToken } from "../lib/2fa";
import { requireAuth } from "../middleware/auth";

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
 * Body: { email, senha, totpToken?, backupCode? }
 */
router.post("/auth/login", validateBody(LoginBody), async (req, res): Promise<void> => {
  const { email, senha, totpToken, backupCode } = req.body as {
    email: string;
    senha: string;
    totpToken?: string;
    backupCode?: string;
  };

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

  if (user.twoFactorEnabled) {
    if (totpToken && verifyToken(user.twoFactorSecret ?? "", totpToken)) {
      // accepted
    } else if (backupCode) {
      const verification = verifyBackupCode(user.backupCodes ?? [], backupCode);
      if (!verification.valid) {
        res.status(401).json({ error: "Token 2FA inválido" });
        return;
      }
      const backupCodes = [...(user.backupCodes ?? [])];
      backupCodes.splice(verification.index ?? -1, 1);
      await db.usuario.update({
        where: { id: user.id },
        data: { backupCodes },
      });
    } else {
      res.status(401).json({ error: "Token 2FA necessário" });
      return;
    }
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

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

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
 * POST /api/auth/2fa/setup
 * Returns a secret, QR code and backup codes for the authenticated user.
 */
router.post(
  "/auth/2fa/setup",
  requireAuth,
  async (req, res): Promise<void> => {
    const currentUser = (req as any).currentUser;
    if (!currentUser?.email) {
      res.status(401).json(response.error("Não autenticado", "UNAUTHENTICATED"));
      return;
    }

    const setup = await generateTwoFactorSecret(currentUser.email);
    res.json(response.success(setup));
  },
);

router.post(
  "/auth/2fa/verify",
  requireAuth,
  validateBody(TwoFactorEnableBody),
  async (req, res): Promise<void> => {
    const { token, secret } = req.body as { token: string; secret: string };
    if (!verifyToken(secret, token)) {
      res.status(400).json(response.error("Token 2FA inválido", "INVALID_2FA_TOKEN"));
      return;
    }

    const currentUser = (req as any).currentUser;
    if (!currentUser?.id) {
      res.status(401).json(response.error("Não autenticado", "UNAUTHENTICATED"));
      return;
    }

    const backupCodes = generateBackupCodes();
    await db.usuario.update({
      where: { id: currentUser.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        backupCodes,
      },
    });

    res.json(response.success({ enabled: true, backupCodes }));
  },
);

router.post(
  "/auth/2fa/disable",
  requireAuth,
  validateBody(TwoFactorDisableBody),
  async (req, res): Promise<void> => {
    const { senha } = req.body as { senha: string };
    const currentUser = (req as any).currentUser;
    if (!currentUser?.id) {
      res.status(401).json(response.error("Não autenticado", "UNAUTHENTICATED"));
      return;
    }

    const user = await db.usuario.findUnique({ where: { id: currentUser.id } });
    if (!user || user.status !== "ativo") {
      res.status(401).json(response.error("Credenciais inválidas", "INVALID_CREDENTIALS"));
      return;
    }

    const valid = await bcrypt.compare(senha, user.senha);
    if (!valid) {
      res.status(401).json(response.error("Credenciais inválidas", "INVALID_CREDENTIALS"));
      return;
    }

    await db.usuario.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      },
    });

    res.json(response.success({ disabled: true }));
  },
);

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
