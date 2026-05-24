import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import {
  CreateProdutoBody,
  UpdateProdutoBody,
  UpdateProdutoParams,
  GetProdutoParams,
  DeleteProdutoParams,
  ListProdutosQueryParams,
} from "../schemas";

const router: IRouter = Router();

function serializeProduto(r: any) {
  return {
    id: r.id,
    codigo: r.codigo,
    nome: r.nome,
    descricao: r.descricao,
    foto: r.foto,
    valor: typeof r.valor === "object" && r.valor !== null ? Number(r.valor) : Number(r.valor),
    estoque: r.estoque,
    status: r.status,
  };
}

router.get("/produtos", async (req, res): Promise<void> => {
  const params = ListProdutosQueryParams.safeParse(req.query);
  const q = params.success ? params.data.q : undefined;

  let rows;
  if (q) {
    rows = await db.produto.findMany({
      where: { nome: { contains: q, mode: "insensitive" } },
      orderBy: { nome: "asc" },
    });
  } else {
    rows = await db.produto.findMany({ orderBy: { nome: "asc" } });
  }

  res.json(rows.map(serializeProduto));
});

router.post("/produtos", async (req, res): Promise<void> => {
  const parsed = CreateProdutoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data: any = { ...parsed.data };
  if (data.valor !== undefined) data.valor = String(data.valor);

  const row = await db.produto.create({ data });
  res.status(201).json(serializeProduto(row));
});

router.get("/produtos/:id", async (req, res): Promise<void> => {
  const p = GetProdutoParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const row = await db.produto.findUnique({ where: { id: p.data.id } });
  if (!row) { res.status(404).json({ error: "Produto nÃ£o encontrado" }); return; }

  res.json(serializeProduto(row));
});

router.patch("/produtos/:id", async (req, res): Promise<void> => {
  const p = UpdateProdutoParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const parsed = UpdateProdutoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data: any = { ...parsed.data };
  if (data.valor !== undefined) data.valor = String(data.valor);

  try {
    const row = await db.produto.update({ where: { id: p.data.id }, data });
    res.json(serializeProduto(row));
  } catch {
    res.status(404).json({ error: "Produto nÃ£o encontrado" });
  }
});

router.delete("/produtos/:id", async (req, res): Promise<void> => {
  const p = DeleteProdutoParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  try {
    await db.produto.delete({ where: { id: p.data.id } });
    res.sendStatus(204);
  } catch {
    res.status(404).json({ error: "Produto nÃ£o encontrado" });
  }
});

export default router;


