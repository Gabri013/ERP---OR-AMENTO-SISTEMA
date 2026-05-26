import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import {
  CreateVendaBody,
  UpdateVendaBody,
  UpdateVendaParams,
  GetVendaParams,
  ListVendasQueryParams,
  GerarOsParaVendaParams,
} from "../schemas";
import { requireAuth, requireRoles, SALES_ROLES } from "../middleware/auth";

const router: IRouter = Router();

async function getNextVendaNum(): Promise<string> {
  const count = await db.venda.count();
  return `VND-${(count + 1).toString().padStart(4, "0")}`;
}

async function getNextOSNum(): Promise<string> {
  const count = await db.ordemServico.count();
  return `OS-${(count + 1).toString().padStart(4, "0")}`;
}

function serializeVenda(r: any, cliente?: any) {
  return {
    id: r.id,
    numero: r.numero,
    orcamentoId: r.orcamentoId,
    clienteId: r.clienteId,
    usuarioId: r.usuarioId,
    dataVenda: r.dataVenda,
    valorTotal: Number(r.valorTotal),
    desconto: Number(r.desconto),
    formaPagamento: r.formaPagamento,
    numParcelas: r.numParcelas,
    status: r.status,
    observacoes: r.observacoes,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
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
          createdAt: cliente.createdAt?.toISOString?.() ?? cliente.createdAt,
        }
      : undefined,
  };
}

router.get(
  "/vendas",
  requireAuth,
  requireRoles(SALES_ROLES),
  async (req, res): Promise<void> => {
    ListVendasQueryParams.safeParse(req.query);
    const status = req.query.status as string | undefined;
    const currentUser = (req as any).currentUser;

    const rows = await db.venda.findMany({
      include: { cliente: true },
      orderBy: { id: "desc" },
    });

    let result = rows.map((r) => ({
      id: r.id,
      numero: r.numero,
      orcamentoId: r.orcamentoId,
      clienteId: r.clienteId,
      usuarioId: r.usuarioId,
      dataVenda: r.dataVenda,
      valorTotal: Number(r.valorTotal),
      desconto: Number(r.desconto),
      formaPagamento: r.formaPagamento,
      numParcelas: r.numParcelas,
      status: r.status,
      observacoes: r.observacoes,
      observacoesVenda: r.observacoesVenda,
      createdAt:
        r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      cliente: r.cliente
        ? {
            id: r.cliente.id,
            razaoSocial: r.cliente.razaoSocial,
            nomeFantasia: r.cliente.nomeFantasia,
            cnpjCpf: r.cliente.cnpjCpf,
            cidade: r.cliente.cidade,
            estado: r.cliente.estado,
            telefone: r.cliente.telefone,
            email: r.cliente.email,
            observacoes: r.cliente.observacoes,
            createdAt:
              r.cliente.createdAt instanceof Date
                ? r.cliente.createdAt.toISOString()
                : r.cliente.createdAt,
          }
        : undefined,
    }));

    if (currentUser.tipo === "vendedor") {
      result = result.filter((r) => r.usuarioId === currentUser.id);
    }

    if (status) result = result.filter((r) => r.status === status);
    res.json(result);
  },
);

router.post(
  "/vendas",
  requireAuth,
  requireRoles(SALES_ROLES),
  async (req, res): Promise<void> => {
    const parsed = CreateVendaBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const userId = (req as any).currentUser?.id ?? 1;
    const { itens, ...vendaData } = parsed.data as any;
    const numero = await getNextVendaNum();

    const valorTotal = itens.reduce(
      (sum: number, i: any) =>
        sum + Number(i.valorUnitario) * Number(i.quantidade),
      0,
    );

    const venda = await db.venda.create({
      data: {
        numero,
        orcamentoId: vendaData.orcamentoId ?? null,
        clienteId: vendaData.clienteId,
        usuarioId: userId,
        dataVenda: vendaData.dataVenda as any,
        valorTotal: valorTotal - Number(vendaData.desconto ?? 0),
        desconto: vendaData.desconto ?? 0,
        formaPagamento: vendaData.formaPagamento,
        numParcelas: vendaData.numParcelas ?? 1,
        status: vendaData.status ?? "em_andamento",
        observacoes: vendaData.observacoes,
        observacoesVenda: vendaData.observacoesVenda,
      },
    });

    for (const item of itens) {
      await db.vendaItem.create({
        data: {
          vendaId: venda.id,
          produtoId: item.produtoId ?? null,
          descricaoManual: item.descricaoManual ?? null,
          quantidade: Number(item.quantidade),
          valorUnitario: Number(item.valorUnitario),
          valorTotal: Number(item.valorUnitario) * Number(item.quantidade),
        },
      });
    }

    // Criar contas a receber
    const totalLiquido = valorTotal - Number(vendaData.desconto ?? 0);
    const numParcelas = vendaData.numParcelas ?? 1;
    const valorParcela = totalLiquido / numParcelas;

    for (let i = 1; i <= numParcelas; i++) {
      await db.contaReceber.create({
        data: {
          vendaId: venda.id,
          clienteId: venda.clienteId,
          parcelaNumero: i,
          totalParcelas: numParcelas,
          valorBruto: valorParcela,
          valorLiquido: valorParcela,
          valorRecebido: 0,
          dataVencimento: vendaData.dataVenda as any,
          formaPagamento: vendaData.formaPagamento ?? "pix",
          status: "PENDENTE",
        },
      });
    }

    const cliente = await db.cliente.findUnique({
      where: { id: venda.clienteId },
    });
    res.status(201).json({
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
    });
  },
);

router.get(
  "/vendas/:id",
  requireAuth,
  requireRoles(SALES_ROLES),
  async (req, res): Promise<void> => {
    const p = GetVendaParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json({ error: p.error.message });
      return;
    }

    const venda = await db.venda.findUnique({
      where: { id: Number(p.data.id) },
      include: { cliente: true },
    });

    if (!venda) {
      res.status(404).json({ error: "Venda não encontrada" });
      return;
    }

    const currentUser = (req as any).currentUser;
    if (currentUser.tipo === "vendedor" && venda.usuarioId !== currentUser.id) {
      res.status(403).json({ error: "Sem permissão para esta venda" });
      return;
    }

    const itens = await db.vendaItem.findMany({
      where: { vendaId: Number(p.data.id) },
    });
    const ordens = await db.ordemServico.findMany({
      where: { vendaId: Number(p.data.id) },
    });

    res.json({
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
      cliente: venda.cliente
        ? {
            id: venda.cliente.id,
            razaoSocial: venda.cliente.razaoSocial,
            nomeFantasia: venda.cliente.nomeFantasia,
            cnpjCpf: venda.cliente.cnpjCpf,
            cidade: venda.cliente.cidade,
            estado: venda.cliente.estado,
            telefone: venda.cliente.telefone,
            email: venda.cliente.email,
            observacoes: venda.cliente.observacoes,
            createdAt:
              venda.cliente.createdAt instanceof Date
                ? venda.cliente.createdAt.toISOString()
                : venda.cliente.createdAt,
          }
        : undefined,
      itens: itens.map((i) => ({
        id: i.id,
        produtoId: i.produtoId,
        descricaoManual: i.descricaoManual,
        quantidade: Number(i.quantidade),
        valorUnitario: Number(i.valorUnitario),
        valorTotal: Number(i.valorTotal),
      })),
      ordensServico: ordens.map((os) => ({
        id: os.id,
        numero: os.numero,
        status: os.status,
      })),
    });
  },
);

router.patch(
  "/vendas/:id",
  requireAuth,
  requireRoles(SALES_ROLES),
  async (req, res): Promise<void> => {
    const p = UpdateVendaParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json({ error: p.error.message });
      return;
    }

    const parsed = UpdateVendaBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const data: any = { ...parsed.data };
    if (data.valorTotal !== undefined)
      data.valorTotal = Number(data.valorTotal);
    if (data.desconto !== undefined) data.desconto = Number(data.desconto);

    try {
      const row = await db.venda.update({
        where: { id: Number(p.data.id) },
        data,
      });
      const cliente = await db.cliente.findUnique({
        where: { id: row.clienteId },
      });
      res.json({
        id: row.id,
        numero: row.numero,
        orcamentoId: row.orcamentoId,
        clienteId: row.clienteId,
        usuarioId: row.usuarioId,
        dataVenda: row.dataVenda,
        valorTotal: Number(row.valorTotal),
        desconto: Number(row.desconto),
        formaPagamento: row.formaPagamento,
        numParcelas: row.numParcelas,
        status: row.status,
        observacoes: row.observacoes,
        createdAt:
          row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : row.createdAt,
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
      });
    } catch {
      res.status(404).json({ error: "Venda não encontrada" });
    }
  },
);

router.post(
  "/vendas/:id/gerar-os",
  requireAuth,
  requireRoles(SALES_ROLES),
  async (req, res): Promise<void> => {
    const p = GerarOsParaVendaParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json({ error: p.error.message });
      return;
    }

    const venda = await db.venda.findUnique({
      where: { id: Number(p.data.id) },
    });
    if (!venda) {
      res.status(404).json({ error: "Venda não encontrada" });
      return;
    }

    const existing = await db.ordemServico.findMany({
      where: { vendaId: Number(p.data.id) },
    });
    if (existing.length > 0) {
      res.status(400).json({ error: "OS já gerada para esta venda" });
      return;
    }

    const numero = await getNextOSNum();
    const today = new Date().toISOString().split("T")[0];

    const os = await db.ordemServico.create({
      data: {
        numero,
        vendaId: venda.id,
        clienteId: venda.clienteId,
        dataInicio: today as any,
        prioridade: "verde",
        status: "pendente",
        etapaAtual: "autorizacao",
      },
    });

    await db.oSHistoricoStatus.create({
      data: {
        osId: os.id,
        statusAnterior: null,
        statusNovo: "pendente",
        observacao: "OS gerada automaticamente a partir da venda",
        usuarioId: (req as any).currentUser?.id ?? 1,
      },
    });

    res.status(201).json({
      id: os.id,
      numero: os.numero,
      vendaId: os.vendaId,
      clienteId: os.clienteId,
      dataInicio: os.dataInicio,
      dataTermino: os.dataTermino,
      prioridade: os.prioridade,
      status: os.status,
      etapaAtual: os.etapaAtual,
      createdAt:
        os.createdAt instanceof Date
          ? os.createdAt.toISOString()
          : os.createdAt,
    });
  },
);

export default router;
