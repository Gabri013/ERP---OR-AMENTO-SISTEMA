import type { RequestHandler } from "express";
import { db } from "@workspace/db";
import { verifyUserToken } from "../lib/jwt";

export const SECTOR_ROLES = ["corte","dobra","solda","refrigeracao","acabamento","finalizacao","montagem"];
export const PRODUCTION_ROLES = ["master","gerente","producao","dashboard_producao","projetista",...SECTOR_ROLES];
export const SALES_ROLES = ["master","gerente","vendedor"];
export const ALL_ROLES = [...new Set([...SALES_ROLES,...PRODUCTION_ROLES])];

async function getUserFromRequest(req: any) {
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
}

export const loadUser: RequestHandler = async (req, _res, next) => {
  const user = await getUserFromRequest(req);
  if (user) {
    (req as any).currentUser = user;
  }
  next();
};

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!(req as any).currentUser) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  next();
};

export function requireRoles(roles: string[]): RequestHandler {
  return (req, res, next) => {
    const user = (req as any).currentUser;
    if (!user) { res.status(401).json({ error: "Não autenticado" }); return; }
    if (!roles.includes(user.tipo)) { res.status(403).json({ error: "Sem permissão para esta ação" }); return; }
    next();
  };
}
