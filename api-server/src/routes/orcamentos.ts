import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import {
  CreateOrcamentoBody,
  UpdateOrcamentoBody,
  UpdateOrcamentoParams,
  GetOrcamentoParams,
  DeleteOrcamentoParams,
  ConverterOrcamentoParams,
  ListOrcamentosQueryParams,
} from "../schemas";
import { requireAuth, requireRoles, SALES_ROLES } from "../middleware/auth";
import { auditLog } from "../middleware/audit";
import { canTransitionOrcamento } from "../lib/stateMachine";
import { response } from "../utils/response";
import { getPagination, buildMeta } from "../utils/pagination";
import { validateBody, validateParams } from "../middleware/validateZod";
import { generateOrcamentoPDF } from "../lib/pdf";
import { sendOrcamentoEmail } from "../lib/email";

const router: IRouter = Router();

async function getNextOrcamentoNum(): Promise<string> {
  const count = await db.orcamento.count();
  return `ORC-${(count + 1).toString().padStart(4, "0")}`;
}

async function getNextVendaNum(): Promise<string> {
  const count = await db.venda.count();
  return `VND-${(count + 1).toString().padStart(4, "0")}`;
}

function serializeOrc(r: any, cliente?: any) {
  return {
    id: r.id,
    numero: r.numero,
    clienteId: r.clienteId,
    usuarioId: r.usuarioId,
    dataOrcamento: r.dataOrcamento,
    validade: r.validade,
    valorTotal: Number(r.valorTotal),
    desconto: Number(r.desconto),
    status: r.status,
    observacoes: r.observacoes,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    cliente: cliente
      ? {
          id: cliente.id,
          razaoSocial: cliente.razaoSocial,
          nomeFantasia: cliente.nomeFantasia,
          cnpjCpf: cliente.cnpjCpf,
          cidade: cliente.cidade,
          estado: cliente.estado,
          telefone: cliente.telefone,
          email: cliente.email,
          observacoes: cliente.observacoes,
          createdAt:
            cliente.createdAt instanceof Date
              ? cliente.createdAt.toISOString()
              : cliente.createdAt,
        }
      : undefined,
  };
}

router.get(
  "/orcamentos",
  requireAuth,
  requireRoles(SALES_ROLES),
  async (req, res): Promise<void> => {
    const params = ListOrcamentosQueryParams.safeParse(req.query);
    const status = params.success ? params.data.status : undefined;
    const currentUser = (req as any).currentUser;
    const isVendedor = currentUser.tipo === "vendedor";

    const { page, limit, skip } = getPagination(req);
    const where: any = isVendedor ? { usuarioId: currentUser.id } : {};
    if (status) where.status = status as any;

    const [rows, total] = await Promise.all([
      db.orcamento.findMany({
        where,
        include: { cliente: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.orcamento.count({ where }),
    ]);
    res.json(
      response.success(
        rows.map((r) => serializeOrc(r, r.cliente)),
        buildMeta(page, limit, total),
      ),
    );
  },
);

router.post(
  "/orcamentos",
  requireAuth,
  requireRoles(SALES_ROLES),
  validateBody(CreateOrcamentoBody),
  async (req, res): Promise<void> => {
    const userId = (req as any).currentUser?.id ?? 1;
    const { itens, ...orcData } = req.body as any;
    const numero = await getNextOrcamentoNum();

    const valorTotal = itens.reduce(
      (sum: number, i: any) =>
        sum + Number(i.valorUnitario) * Number(i.quantidade),
      0,
    );

    const orc = await db.orcamento.create({
      data: {
        numero,
        clienteId: orcData.clienteId,
        usuarioId: userId,
        dataOrcamento: orcData.dataOrcamento,
        validade: orcData.validade,
        valorTotal: valorTotal - Number(orcData.desconto ?? 0),
        desconto: orcData.desconto ?? 0,
        status: orcData.status ?? "pendente",
        observacoes: orcData.observacoes,
      },
    });

    for (const item of itens) {
      await db.orcamentoItem.create({
        data: {
          orcamentoId: orc.id,
          produtoId: item.produtoId ?? null,
          descricaoManual: item.descricaoManual ?? null,
          quantidade: Number(item.quantidade),
          valorUnitario: Number(item.valorUnitario),
          valorTotal: Number(item.valorUnitario) * Number(item.quantidade),
        },
      });
    }

    const cliente = await db.cliente.findUnique({
      where: { id: orc.clienteId },
    });

    // Send email notification if client has email
    if (cliente?.email) {
      sendOrcamentoEmail(orc.id, cliente.email, numero).catch(console.error);
    }

    res.status(201).json(response.success(serializeOrc(orc, cliente)));
  },
);

router.get(
  "/orcamentos/:id",
  requireAuth,
  requireRoles(SALES_ROLES),
  auditLog({
    action: "view",
    module: "orcamentos",
    table: "Orcamento",
  }),
  async (req, res): Promise<void> => {
    const p = GetOrcamentoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const id = Number(p.data.id);
    const orc = await db.orcamento.findUnique({
      where: { id },
      include: { cliente: true },
    });

    if (!orc) {
      res
        .status(404)
        .json(response.error("Orçamento não encontrado", "NOT_FOUND"));
      return;
    }

    const currentUser = (req as any).currentUser;
    if (currentUser.tipo === "vendedor" && orc.usuarioId !== currentUser.id) {
      res
        .status(403)
        .json(response.error("Sem permissão para este orçamento", "FORBIDDEN"));
      return;
    }

    const itens = await db.orcamentoItem.findMany({
      where: { orcamentoId: id },
      include: { produto: true },
    });

    const serializedOrc = serializeOrc(orc, orc.cliente);
    const serializedItens = itens.map((i) => ({
      id: i.id,
      produtoId: i.produtoId,
      descricaoManual: i.descricaoManual,
      quantidade: Number(i.quantidade),
      valorUnitario: Number(i.valorUnitario),
      valorTotal: Number(i.valorTotal),
      produto: i.produto
        ? {
            id: i.produto.id,
            codigo: i.produto.codigo,
            nome: i.produto.nome,
            descricao: i.produto.descricao,
            foto: i.produto.foto,
            valor: Number(i.produto.valor),
            estoque: i.produto.estoque,
            status: i.produto.status,
          }
        : undefined,
    }));

    res.json(response.success({ ...serializedOrc, itens: serializedItens }));
  },
);

router.patch(
  "/orcamentos/:id",
  requireAuth,
  requireRoles(SALES_ROLES),
  validateParams(UpdateOrcamentoParams),
  validateBody(UpdateOrcamentoBody),
  auditLog({
    action: "update",
    module: "orcamentos",
    table: "Orcamento",
  }),
  async (req, res): Promise<void> => {
    const p = UpdateOrcamentoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const data: any = { ...req.body };
    if (data.desconto !== undefined) data.desconto = Number(data.desconto);

    if (data.status) {
      const orc = await db.orcamento.findUnique({
        where: { id: Number(p.data.id) },
      });
      if (orc) {
        const validation = canTransitionOrcamento(orc.status, data.status);
        if (!validation.valid) {
          res
            .status(400)
            .json(
              response.error(
                validation.error || "Transição inválida",
                "INVALID_TRANSITION",
              ),
            );
          return;
        }
      }
    }

    try {
      const id = Number(p.data.id);
      const row = await db.orcamento.update({ where: { id }, data });
      res.json(response.success(serializeOrc(row)));
    } catch {
      res
        .status(404)
        .json(response.error("Orçamento não encontrado", "NOT_FOUND"));
    }
  },
);

router.delete(
  "/orcamentos/:id",
  requireAuth,
  requireRoles(["master", "gerente"]),
  auditLog({
    action: "delete",
    module: "orcamentos",
    table: "Orcamento",
  }),
  async (req, res): Promise<void> => {
    const p = DeleteOrcamentoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    try {
      const id = Number(p.data.id);
      await db.orcamento.delete({ where: { id } });
      res.sendStatus(204);
    } catch {
      res
        .status(404)
        .json(response.error("Orçamento não encontrado", "NOT_FOUND"));
    }
  },
);

router.post(
  "/orcamentos/:id/converter",
  requireAuth,
  requireRoles(SALES_ROLES),
  validateParams(ConverterOrcamentoParams),
  auditLog({
    action: "converter",
    module: "orcamentos",
    table: "Orcamento",
  }),
  async (req, res): Promise<void> => {
    const p = ConverterOrcamentoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const id = Number(p.data.id);
    const orc = await db.orcamento.findUnique({ where: { id } });
    if (!orc) {
      res
        .status(404)
        .json(response.error("Orçamento não encontrado", "NOT_FOUND"));
      return;
    }
    if (orc.status === "convertido") {
      res
        .status(400)
        .json(response.error("Orçamento já convertido", "ALREADY_CONVERTED"));
      return;
    }

    const validation = canTransitionOrcamento(orc.status, "convertido");
    if (!validation.valid) {
      res
        .status(400)
        .json(
          response.error(
            validation.error || "Transição inválida",
            "INVALID_TRANSITION",
          ),
        );
      return;
    }

    const userId = (req as any).currentUser?.id ?? 1;
    const numero = await getNextVendaNum();
    const today = new Date().toISOString().split("T")[0];

    const venda = await db.venda.create({
      data: {
        numero,
        orcamentoId: orc.id,
        clienteId: orc.clienteId,
        usuarioId: userId,
        dataVenda: today as any,
        valorTotal: orc.valorTotal,
        desconto: orc.desconto,
        status: "em_andamento",
      },
    });

    const orcItens = await db.orcamentoItem.findMany({
      where: { orcamentoId: orc.id },
    });
    for (const item of orcItens) {
      await db.vendaItem.create({
        data: {
          vendaId: venda.id,
          produtoId: item.produtoId,
          descricaoManual: item.descricaoManual,
          quantidade: Number(item.quantidade),
          valorUnitario: Number(item.valorUnitario),
          valorTotal: Number(item.valorTotal),
        },
      });
    }

    await db.orcamento.update({
      where: { id: orc.id },
      data: { status: "convertido" },
    });

    const cliente = await db.cliente.findUnique({
      where: { id: venda.clienteId },
    });
    res.status(201).json(
      response.success({
        id: venda.id,
        numero: venda.numero,
        orcamentoId: venda.orcamentoId,
        clienteId: venda.clienteId,
        usuarioId: venda.usuarioId,
        dataVenda: venda.dataVenda,
        valorTotal: Number(venda.valorTotal),
        desconto: Number(venda.desconto),
        formaPagamento: venda.formaPagamento,
        numParcelas: venda.numParcelas,
        status: venda.status,
        observacoes: venda.observacoes,
        createdAt:
          venda.createdAt instanceof Date
            ? venda.createdAt.toISOString()
            : venda.createdAt,
        cliente: cliente
          ? {
              id: cliente.id,
              razaoSocial: cliente.razaoSocial,
              nomeFantasia: cliente.nomeFantasia,
              cnpjCpf: cliente.cnpjCpf,
              cidade: cliente.cidade,
              estado: cliente.estado,
              telefone: cliente.telefone,
              email: cliente.email,
              observacoes: cliente.observacoes,
              createdAt:
                cliente.createdAt instanceof Date
                  ? cliente.createdAt.toISOString()
                  : cliente.createdAt,
            }
          : undefined,
      }),
    );
  },
);

// GET /orcamentos/:id/pdf - Generate PDF
router.get(
  "/orcamentos/:id/pdf",
  requireAuth,
  requireRoles(SALES_ROLES),
  validateParams(GetOrcamentoParams),
  async (req, res): Promise<void> => {
    const p = GetOrcamentoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    try {
      const pdfBuffer = await generateOrcamentoPDF(Number(p.data.id));
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=orcamento-${p.data.id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json(response.error('Erro ao gerar PDF', 'PDF_ERROR'));
    }
  },
);

export default router;
