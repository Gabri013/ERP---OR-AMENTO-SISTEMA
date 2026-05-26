import type { RequestHandler } from "express";
import { db } from "../lib/prisma";
import { verifyUserToken } from "../lib/jwt";
import { response } from "../utils/response";

export const SECTOR_ROLES = [
  "corte",
  "dobra",
  "solda",
  "refrigeracao",
  "acabamento",
  "finalizacao",
  "montagem",
];
export const PRODUCTION_ROLES = [
  "master",
  "gerente",
  "producao",
  "engenharia",
  "dashboard_producao",
  "projetista",
  ...SECTOR_ROLES,
];
export const SALES_ROLES = ["master", "gerente", "vendedor"];
export const FINANCEIRO_ROLES = ["master", "gerente", "financeiro"];
export const ADMIN_ROLES = ["master", "gerente"];
export const ALL_ROLES = Array.from(
  new Set([
    ...SALES_ROLES,
    ...PRODUCTION_ROLES,
    ...FINANCEIRO_ROLES,
    "visualizador",
  ]),
);

async function getUserFromRequest(req: any) {
  try {
    let token: string | undefined;

    const auth = req.headers?.authorization;
    if (auth?.startsWith("Bearer ")) {
      token = auth.substring(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) return null;

    const claims = await verifyUserToken(token);
    if (!claims) return null;

    const user = await db.usuario.findUnique({
      where: { id: claims.sub },
    });

    if (user && user.status === "ativo") {
      return user;
    }
    return null;
  } catch (err) {
    // Don't crash the serverless function on DB/auth errors
    console.error("loadUser error:", err);
    return null;
  }
}

export const loadUser: RequestHandler = async (req, _res, next) => {
  try {
    let token: string | undefined;
    const auth = req.headers?.authorization;

    if (auth?.startsWith("Bearer ")) {
      token = auth.substring(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.query?.token && typeof req.query.token === "string") {
      // Allow token via query param for file viewer (Three.js loaders can't set headers)
      token = req.query.token;
    }

    if (!token) {
      next();
      return;
    }

    const claims = await verifyUserToken(token);
    if (!claims) {
      next();
      return;
    }

    // Try to get user from DB, but don't fail if DB is slow
    const user = await db.usuario
      .findUnique({
        where: { id: claims.sub },
      })
      .catch(() => null);

    if (user && user.status === "ativo") {
      (req as any).currentUser = user;
    } else {
      // If user not found in DB, still set minimal user info from token
      (req as any).currentUser = {
        id: claims.sub,
        nome: claims.nome,
        email: claims.email,
        tipo: claims.tipo,
        status: "ativo",
      };
    }
  } catch (err) {
    console.error("loadUser error:", err);
  }
  next();
};

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!(req as any).currentUser) {
    res.status(401).json(response.error("Não autenticado", "UNAUTHENTICATED"));
    return;
  }
  next();
};

export function requireRoles(roles: string[]): RequestHandler {
  return (req, res, next) => {
    const user = (req as any).currentUser;
    if (!user) {
      res
        .status(401)
        .json(response.error("Não autenticado", "UNAUTHENTICATED"));
      return;
    }
    if (!roles.includes(user.tipo)) {
      res
        .status(403)
        .json(response.error("Sem permissão para esta ação", "FORBIDDEN"));
      return;
    }
    next();
  };
}
