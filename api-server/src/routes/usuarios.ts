import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "../lib/prisma";
import {
  CreateUsuarioBody,
  UpdateUsuarioBody,
  UpdateUsuarioParams,
  DeleteUsuarioParams,
} from "../schemas";
import { requireAuth, requireRoles } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { response } from "../utils/response";

const router: IRouter = Router();

function serializeUser(r: any) {
  return {
    id: r.id,
    nome: r.nome,
    email: r.email,
    tipo: r.tipo,
    status: r.status,
    telefoneWhatsapp: r.telefoneWhatsapp,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  };
}

router.get(
  "/usuarios",
  requireAuth,
  requireRoles(["master"]),
  async (_req, res): Promise<void> => {
    const rows = await db.usuario.findMany({ orderBy: { nome: "asc" } });
    res.json(response.success(rows.map(serializeUser)));
  },
);

router.post(
  "/usuarios",
  requireAuth,
  requireRoles(["master"]),
  validate(CreateUsuarioBody),
  async (req, res): Promise<void> => {
    const hashedSenha = await bcrypt.hash(req.body.senha, 10);
    const row = await db.usuario.create({
      data: { ...req.body, senha: hashedSenha },
    });

    res.status(201).json(response.success(serializeUser(row)));
  },
);

router.patch(
  "/usuarios/:id",
  requireAuth,
  requireRoles(["master"]),
  validate(UpdateUsuarioBody),
  async (req, res): Promise<void> => {
    const p = UpdateUsuarioParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const data: any = { ...req.body };
    if (data.senha) {
      data.senha = await bcrypt.hash(data.senha, 10);
    }

    try {
      const row = await db.usuario.update({
        where: { id: Number(p.data.id) },
        data,
      });
      res.json(response.success(serializeUser(row)));
    } catch {
      res
        .status(404)
        .json(response.error("Usuário não encontrado", "NOT_FOUND"));
    }
  },
);

router.delete(
  "/usuarios/:id",
  requireAuth,
  requireRoles(["master"]),
  async (req, res): Promise<void> => {
    const p = DeleteUsuarioParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    try {
      await db.usuario.delete({ where: { id: Number(p.data.id) } });
      res.sendStatus(204);
    } catch {
      res
        .status(404)
        .json(response.error("Usuário não encontrado", "NOT_FOUND"));
    }
  },
);

export default router;
