import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { LoginBody, LoginResponse } from "@workspace/api-zod";
import { signUserToken, verifyUserToken } from "../lib/jwt";

const router: IRouter = Router();

/**
 * POST /api/auth/login
 * Body: { email, senha }
 * Returns user profile + JWT token (replaces old session cookie)
 */
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, senha } = parsed.data;

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

  const token = await signUserToken({
    sub: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo,
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
  const profile = LoginResponse.parse({
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo,
  });

  res.json({ ...profile, token });
});

/**
 * POST /api/auth/logout
 */
router.post("/auth/logout", async (req, res): Promise<void> => {
  res.clearCookie("token", { path: "/" });
  res.json({ ok: true });
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

  res.json({ id: user.id, nome: user.nome, email: user.email, tipo: user.tipo });
});

export default router;
