import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import { requireAuth, requireRoles, ALL_ROLES, PRODUCTION_ROLES } from "../middleware/auth";
import { response } from "../utils/response";

const router: IRouter = Router();

const TIPOS_VALIDOS = ["pdf", "dxf", "dwg", "imagem", "step", "manual", "foto", "outro"];

// GET /os/:id/anexos
router.get("/os/:id/anexos", requireAuth, requireRoles(ALL_ROLES), async (req, res): Promise<void> => {
  const osId = Number(req.params.id);
  const nm = (db as any).oSAnexo;
  const items = await nm.findMany({
    where: { osId },
    orderBy: { createdAt: "desc" },
  });
  res.json(response.success(items));
});

// POST /os/:id/anexos - adiciona anexo por URL
router.post("/os/:id/anexos", requireAuth, requireRoles(PRODUCTION_ROLES), async (req, res): Promise<void> => {
  const osId = Number(req.params.id);
  const { nome, url, tipo, descricao } = req.body;
  const userId = (req as any).currentUser?.id;

  if (!nome || !url) {
    res.status(400).json(response.error("nome e url são obrigatórios", "VALIDATION_ERROR"));
    return;
  }

  const nm = (db as any).oSAnexo;
  const created = await nm.create({
    data: {
      osId,
      nome,
      url,
      tipo: TIPOS_VALIDOS.includes(tipo) ? tipo : "outro",
      descricao: descricao ?? null,
      usuarioId: userId,
    },
  });
  res.status(201).json(response.success(created));
});

// DELETE /os/:id/anexos/:anexoId
router.delete("/os/:id/anexos/:anexoId", requireAuth, requireRoles(PRODUCTION_ROLES), async (req, res): Promise<void> => {
  const anexoId = Number(req.params.anexoId);
  const nm = (db as any).oSAnexo;

  const anexo = await nm.findUnique({ where: { id: anexoId } });
  if (!anexo) {
    res.status(404).json(response.error("Anexo não encontrado", "NOT_FOUND"));
    return;
  }

  await nm.delete({ where: { id: anexoId } });
  res.json(response.success({ ok: true }));
});

export default router;
