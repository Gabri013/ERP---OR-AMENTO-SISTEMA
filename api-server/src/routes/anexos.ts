import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import {
  requireAuth,
  requireRoles,
  ALL_ROLES,
  PRODUCTION_ROLES,
} from "../middleware/auth";
import { response } from "../utils/response";

const router: IRouter = Router();

const TIPOS_VALIDOS = [
  "pdf",
  "dxf",
  "dwg",
  "step",
  "3d",
  "bom",
  "imagem",
  "foto",
  "manual",
  "outro",
];
const nm = () => (db as any).oSAnexo;

// ──────────────────────────────────────────────
// GET /os/:id/itens-com-anexos
// Returns all items of the OS venda, each with their own anexos array
// ──────────────────────────────────────────────
router.get(
  "/os/:id/itens-com-anexos",
  requireAuth,
  requireRoles(ALL_ROLES),
  async (req, res): Promise<void> => {
    const osId = Number(req.params.id);

    const os = await db.ordemServico.findUnique({
      where: { id: osId },
      select: { vendaId: true, numero: true },
    });

    if (!os?.vendaId) {
      res.json(response.success([]));
      return;
    }

    const itens = await db.vendaItem.findMany({
      where: { vendaId: os.vendaId },
      include: { produto: true },
      orderBy: { id: "asc" },
    });

    const resultadoItens = await Promise.all(
      itens.map(async (item) => {
        const anexos = await nm().findMany({
          where: { vendaItemId: item.id },
          orderBy: { tipo: "asc" },
        });
        return {
          id: item.id,
          produtoId: item.produtoId,
          descricao:
            item.descricaoManual ?? item.produto?.nome ?? `Item #${item.id}`,
          codigo: item.produto?.codigo ?? null,
          quantidade: Number(item.quantidade),
          valorUnitario: Number(item.valorUnitario),
          produto: item.produto
            ? {
                id: item.produto.id,
                nome: item.produto.nome,
                codigo: item.produto.codigo,
              }
            : null,
          anexos: anexos.map((a: any) => ({
            id: a.id,
            nome: a.nome,
            url: a.url,
            tipo: a.tipo,
            descricao: a.descricao,
            createdAt: a.createdAt,
          })),
        };
      }),
    );

    res.json(response.success(resultadoItens));
  },
);

// ──────────────────────────────────────────────
// GET /os/:id/anexos
// Returns OS-level anexos (not item-specific) OR filtered by ?itemId=X
// ──────────────────────────────────────────────
router.get(
  "/os/:id/anexos",
  requireAuth,
  requireRoles(ALL_ROLES),
  async (req, res): Promise<void> => {
    const osId = Number(req.params.id);
    const itemId = req.query.itemId ? Number(req.query.itemId) : undefined;

    const where: any = { osId };
    if (itemId) {
      where.vendaItemId = itemId;
    } else {
      where.vendaItemId = null; // OS-level only
    }

    const items = await nm().findMany({
      where,
      orderBy: [{ tipo: "asc" }, { createdAt: "desc" }],
    });
    res.json(response.success(items));
  },
);

// ──────────────────────────────────────────────
// POST /os/:id/anexos
// Body: { nome, url, tipo, descricao, vendaItemId? }
// vendaItemId = specific product item; null = OS-level
// ──────────────────────────────────────────────
router.post(
  "/os/:id/anexos",
  requireAuth,
  requireRoles(PRODUCTION_ROLES),
  async (req, res): Promise<void> => {
    const osId = Number(req.params.id);
    const { nome, url, tipo, descricao, vendaItemId } = req.body;
    const userId = (req as any).currentUser?.id;

    if (!nome?.trim() || !url?.trim()) {
      res
        .status(400)
        .json(
          response.error("nome e url são obrigatórios", "VALIDATION_ERROR"),
        );
      return;
    }

    // If vendaItemId provided, validate it belongs to this OS
    if (vendaItemId) {
      const os = await db.ordemServico.findUnique({
        where: { id: osId },
        select: { vendaId: true },
      });
      if (os?.vendaId) {
        const itemExists = await db.vendaItem.findFirst({
          where: { id: Number(vendaItemId), vendaId: os.vendaId },
        });
        if (!itemExists) {
          res
            .status(400)
            .json(
              response.error("Item não pertence a esta OS", "VALIDATION_ERROR"),
            );
          return;
        }
      }
    }

    const created = await nm().create({
      data: {
        osId,
        vendaItemId: vendaItemId ? Number(vendaItemId) : null,
        nome: nome.trim(),
        url: url.trim(),
        tipo: TIPOS_VALIDOS.includes(tipo) ? tipo : "outro",
        descricao: descricao?.trim() ?? null,
        usuarioId: userId,
      },
    });

    res.status(201).json(response.success(created));
  },
);

// ──────────────────────────────────────────────
// DELETE /os/:id/anexos/:anexoId
// ──────────────────────────────────────────────
router.delete(
  "/os/:id/anexos/:anexoId",
  requireAuth,
  requireRoles(PRODUCTION_ROLES),
  async (req, res): Promise<void> => {
    const anexoId = Number(req.params.anexoId);
    const osId = Number(req.params.id);

    const anexo = await nm().findUnique({ where: { id: anexoId } });
    if (!anexo || anexo.osId !== osId) {
      res.status(404).json(response.error("Anexo não encontrado", "NOT_FOUND"));
      return;
    }

    await nm().delete({ where: { id: anexoId } });
    res.json(response.success({ ok: true }));
  },
);

export default router;
