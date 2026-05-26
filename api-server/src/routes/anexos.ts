import { Router, type IRouter } from "express";
import multer from "multer";
import { db } from "../lib/prisma";
import {
  requireAuth,
  requireRoles,
  ALL_ROLES,
  PRODUCTION_ROLES,
} from "../middleware/auth";
import { response } from "../utils/response";
import type { Request } from "express";

const router: IRouter = Router();

// Multer: memory storage, 50MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/octet-stream",
      "model/stl",
      "model/obj",
      "model/gltf+json",
      "model/gltf-binary",
      "application/sla",
      "application/vnd.ms-pki.stl",
      "image/vnd.dxf",
      "application/dxf",
      "image/x-dxf",
      "application/acad",
      "image/vnd.dwg",
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "text/plain",
    ];
    // Accept any file - MIME type detection is unreliable for CAD formats
    cb(null, true);
  },
});

// Map extension → MIME type for CAD files
function getMimeFromExt(originalname: string): string {
  const ext = originalname.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    stl: "model/stl",
    obj: "model/obj",
    gltf: "model/gltf+json",
    glb: "model/gltf-binary",
    dxf: "image/vnd.dxf",
    dwg: "application/acad",
    step: "application/step",
    stp: "application/step",
    iges: "application/iges",
    igs: "application/iges",
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
    zip: "application/zip",
  };
  return map[ext] ?? "application/octet-stream";
}

function getTipoFromExt(originalname: string): string {
  const ext = originalname.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    stl: "stl",
    obj: "obj",
    gltf: "gltf",
    glb: "glb",
    dxf: "dxf",
    dwg: "dwg",
    step: "step",
    stp: "step",
    iges: "iges",
    igs: "iges",
    pdf: "pdf",
    png: "imagem",
    jpg: "imagem",
    jpeg: "imagem",
    webp: "imagem",
    bom: "bom",
  };
  return map[ext] ?? "outro";
}

const nm = () => (db as any).oSAnexo;

// ──────────────────────────────────────────────────────
// GET /os/:id/itens-com-anexos
// Returns all items with their attached files
// ──────────────────────────────────────────────────────
router.get(
  "/os/:id/itens-com-anexos",
  requireAuth,
  requireRoles(ALL_ROLES),
  async (req, res): Promise<void> => {
    const osId = Number(req.params.id);

    const os = await db.ordemServico.findUnique({
      where: { id: osId },
      select: { vendaId: true },
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

    const resultado = await Promise.all(
      itens.map(async (item) => {
        const anexos = await nm().findMany({
          where: { vendaItemId: item.id },
          orderBy: [{ tipo: "asc" }, { createdAt: "desc" }],
          select: {
            id: true,
            nome: true,
            tipo: true,
            descricao: true,
            mimeType: true,
            tamanho: true,
            url: true,
            createdAt: true,
            // Never return conteudo in the list (too large)
          },
        });
        return {
          id: item.id,
          produtoId: item.produtoId,
          descricao:
            item.descricaoManual ?? item.produto?.nome ?? `Item #${item.id}`,
          codigo: item.produto?.codigo ?? null,
          tipoProduto: (item.produto as any)?.tipoProduto ?? "padrao",
          quantidade: Number(item.quantidade),
          produto: item.produto
            ? {
                id: item.produto.id,
                nome: item.produto.nome,
                codigo: item.produto.codigo,
              }
            : null,
          anexos,
        };
      }),
    );

    res.json(response.success(resultado));
  },
);

// ──────────────────────────────────────────────────────
// POST /os/:id/upload
// Multipart file upload — stores in DB
// ──────────────────────────────────────────────────────
router.post(
  "/os/:id/upload",
  requireAuth,
  requireRoles(PRODUCTION_ROLES),
  upload.single("arquivo"),
  async (
    req: Request & { file?: Express.Multer.File },
    res: any,
  ): Promise<void> => {
    const osId = Number(req.params.id);
    const file = req.file;
    const { vendaItemId, descricao } = req.body;
    const userId = (req as any).currentUser?.id;

    if (!file) {
      res
        .status(400)
        .json(response.error("Nenhum arquivo enviado", "VALIDATION_ERROR"));
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      res
        .status(400)
        .json(
          response.error(
            "Arquivo muito grande. Máximo 50MB.",
            "FILE_TOO_LARGE",
          ),
        );
      return;
    }

    // If vendaItemId, validate it belongs to this OS
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

    const mimeType =
      file.mimetype === "application/octet-stream"
        ? getMimeFromExt(file.originalname)
        : file.mimetype;

    const tipo = getTipoFromExt(file.originalname);

    const created = await nm().create({
      data: {
        osId,
        vendaItemId: vendaItemId ? Number(vendaItemId) : null,
        nome: file.originalname,
        url: null,
        conteudo: file.buffer,
        mimeType,
        tamanho: file.size,
        tipo,
        descricao: descricao?.trim() ?? null,
        usuarioId: userId,
      },
    });

    // Return without conteudo (too large)
    res.status(201).json(
      response.success({
        id: created.id,
        nome: created.nome,
        tipo: created.tipo,
        mimeType: created.mimeType,
        tamanho: created.tamanho,
        descricao: created.descricao,
        vendaItemId: created.vendaItemId,
        createdAt: created.createdAt,
      }),
    );
  },
);

// ──────────────────────────────────────────────────────
// GET /os/:id/anexos/:anexoId/download
// Serve the file with correct Content-Type
// ──────────────────────────────────────────────────────
router.get(
  "/os/:id/anexos/:anexoId/download",
  requireAuth,
  requireRoles(ALL_ROLES),
  async (req, res): Promise<void> => {
    const anexoId = Number(req.params.anexoId);
    const osId = Number(req.params.id);

    const anexo = await nm().findUnique({ where: { id: anexoId } });

    if (!anexo || anexo.osId !== osId) {
      res
        .status(404)
        .json(response.error("Arquivo não encontrado", "NOT_FOUND"));
      return;
    }

    if (!anexo.conteudo && !anexo.url) {
      res
        .status(404)
        .json(
          response.error("Conteúdo do arquivo não disponível", "NOT_FOUND"),
        );
      return;
    }

    if (anexo.url && !anexo.conteudo) {
      res.redirect(302, anexo.url);
      return;
    }

    const contentType = anexo.mimeType ?? "application/octet-stream";
    const filename = encodeURIComponent(anexo.nome ?? `arquivo.${anexo.tipo}`);

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${filename}`,
    );
    res.setHeader("Content-Length", anexo.tamanho ?? anexo.conteudo.length);
    res.setHeader("Cache-Control", "private, max-age=3600");

    res.send(
      Buffer.isBuffer(anexo.conteudo)
        ? anexo.conteudo
        : Buffer.from(anexo.conteudo),
    );
  },
);

// ──────────────────────────────────────────────────────
// GET /os/:id/anexos/:anexoId/view
// Serve inline (for 3D viewer) — accepts token via query param for viewer
// ──────────────────────────────────────────────────────
// token via query param already handled in loadUser middleware
router.get(
  "/os/:id/anexos/:anexoId/view",
  requireAuth,
  requireRoles(ALL_ROLES),
  async (req, res): Promise<void> => {
    const anexoId = Number(req.params.anexoId);
    const osId = Number(req.params.id);

    const anexo = await nm().findUnique({ where: { id: anexoId } });

    if (!anexo || anexo.osId !== osId || !anexo.conteudo) {
      res.status(404).end();
      return;
    }

    const contentType = anexo.mimeType ?? "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.send(
      Buffer.isBuffer(anexo.conteudo)
        ? anexo.conteudo
        : Buffer.from(anexo.conteudo),
    );
  },
);

// ──────────────────────────────────────────────────────
// DELETE /os/:id/anexos/:anexoId
// ──────────────────────────────────────────────────────
router.delete(
  "/os/:id/anexos/:anexoId",
  requireAuth,
  requireRoles(PRODUCTION_ROLES),
  async (req, res): Promise<void> => {
    const anexoId = Number(req.params.anexoId);
    const osId = Number(req.params.id);

    const anexo = await nm().findUnique({ where: { id: anexoId } });
    if (!anexo || anexo.osId !== osId) {
      res
        .status(404)
        .json(response.error("Arquivo não encontrado", "NOT_FOUND"));
      return;
    }

    await nm().delete({ where: { id: anexoId } });
    res.json(response.success({ ok: true }));
  },
);

export default router;
