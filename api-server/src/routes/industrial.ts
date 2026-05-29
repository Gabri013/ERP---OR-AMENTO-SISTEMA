import { Router, type IRouter } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { auditLog } from "../middleware/audit";
import { response } from "../utils/response";

const router: IRouter = Router();

const INDUSTRIAL_SECTORS = [
  "Corte",
  "Dobra",
  "Solda",
  "Montagem",
  "Acabamento",
  "Polimento",
  "Expedição",
];

const DEFAULT_MATERIALS = [
  {
    codigo: "INOX-304-1200",
    descricao: "Chapa inox 304 escovada 1,20mm",
    categoria: "chapa inox",
    unidade: "folha",
    estoqueMinimo: 20,
    estoqueAtual: 42,
    estoqueReservado: 18,
    localizacao: "A1-03",
    lotePadrao: "L2605-88",
    custoMedio: 690,
  },
  {
    codigo: "TUBO-304-40X40",
    descricao: "Tubo quadrado inox 40x40x1,5",
    categoria: "tubo",
    unidade: "barra",
    estoqueMinimo: 30,
    estoqueAtual: 76,
    estoqueReservado: 31,
    localizacao: "B2-01",
    lotePadrao: "L2605-42",
    custoMedio: 148,
  },
  {
    codigo: "PERFIL-U-INOX",
    descricao: "Perfil U inox para acabamento",
    categoria: "perfil",
    unidade: "barra",
    estoqueMinimo: 18,
    estoqueAtual: 13,
    estoqueReservado: 10,
    localizacao: "C1-09",
    lotePadrao: "L2604-19",
    custoMedio: 96,
  },
  {
    codigo: "RODIZIO-INOX-4",
    descricao: "Rodízio industrial inox 4 polegadas",
    categoria: "acessorio",
    unidade: "un",
    estoqueMinimo: 24,
    estoqueAtual: 8,
    estoqueReservado: 12,
    localizacao: "D4-12",
    lotePadrao: "L2603-71",
    custoMedio: 55,
  },
];

function toNumber(value: any) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function materialStatus(material: any) {
  const atual = toNumber(material.estoqueAtual);
  const reservado = toNumber(material.estoqueReservado);
  const minimo = toNumber(material.estoqueMinimo);
  const saldo = atual - reservado;
  if (saldo <= 0 || atual < minimo * 0.5) return "critico";
  if (atual <= minimo || saldo <= minimo) return "baixo";
  return "ok";
}

function serializeMaterial(material: any) {
  return {
    id: material.id,
    code: material.codigo,
    material: material.descricao,
    category: material.categoria,
    unit: material.unidade,
    available: toNumber(material.estoqueAtual),
    reserved: toNumber(material.estoqueReservado),
    minimum: toNumber(material.estoqueMinimo),
    location: material.localizacao,
    lot: material.lotePadrao,
    averageCost: toNumber(material.custoMedio),
    status: materialStatus(material),
    supplier: material.fornecedor
      ? {
          id: material.fornecedor.id,
          name: material.fornecedor.razaoSocial,
          homologated: material.fornecedor.homologado,
        }
      : null,
  };
}

function serializeOrder(os: any) {
  const etapas = os.etapas ?? [];
  const apontamentos = os.apontamentos ?? [];
  const totalSteps = Math.max(etapas.length, 1);
  const doneSteps = etapas.filter((e: any) => e.status === "concluido").length;

  const firstItem = os.venda?.itens?.[0];
  const product =
    firstItem?.descricaoManual ??
    firstItem?.produto?.nome ??
    os.venda?.observacoesVenda ??
    "Produto sob encomenda";

  return {
    id: os.id,
    number: os.numero,
    client: os.cliente?.razaoSocial ?? "Cliente não informado",
    product,
    quantity: firstItem ? toNumber(firstItem.quantidade) : 1,
    clientId: os.clienteId,
    saleId: os.vendaId,
    status: os.status,
    currentSector: os.etapaAtual,
    priority: os.prioridade,
    startDate: os.dataInicio,
    deliveryDate: os.dataTermino,
    progress: Math.round((doneSteps / totalSteps) * 100),
    notes: os.observacoesGerais,
    labels: os.etiquetas?.length ?? 0,
    inspections: os.inspecoesQualidade?.length ?? 0,
    rework: apontamentos.filter((a: any) => a.retrabalho).length,
    apontamentos: apontamentos.length,
    elapsedHours: apontamentos.reduce((acc: number, item: any) => acc + (item.tempoMin ?? 0), 0) / 60,
    slaHours: 72,
  };
}

router.get(
  "/industrial/dashboard",
  requireAuth,
  auditLog({ action: "view", module: "industrial", table: "DashboardIndustrial" }),
  async (_req, res): Promise<void> => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [
      osEmAndamento,
      producaoDia,
      rework,
      materiaisCriticos,
      setores,
      apontamentos,
      faturamento,
      ordens,
      vendas,
      orcamentos,
      planos,
      etiquetas,
      qualidade,
    ] = await Promise.all([
      db.ordemServico.count({
        where: { status: { in: ["pendente", "liberada", "em_producao", "pausado", "em_revisao"] } },
      }),
      db.apontamentoProducao.count({ where: { createdAt: { gte: startOfDay } } }),
      db.apontamentoProducao.count({ where: { retrabalho: true, createdAt: { gte: startOfDay } } }),
      db.material.findMany({ take: 100, orderBy: { descricao: "asc" } }),
      db.setor.findMany({ include: { capacidades: { orderBy: { data: "desc" }, take: 1 } } }),
      db.apontamentoProducao.findMany({
        where: { createdAt: { gte: startOfDay } },
        include: { usuario: true, setor: true },
      }),
      db.venda.aggregate({ _sum: { valorTotal: true } }),
      db.ordemServico.findMany({
        include: {
          cliente: true,
          etapas: true,
          apontamentos: true,
          etiquetas: true,
          inspecoesQualidade: true,
          venda: { include: { itens: { include: { produto: true } } } },
        },
        orderBy: [{ prioridade: "desc" }, { dataTermino: "asc" }],
        take: 50,
      }),
      db.venda.findMany({ orderBy: { dataVenda: "asc" }, take: 500 }),
      db.orcamento.count({ where: { status: { not: "convertido" } } }),
      db.planoProducao.count({ where: { status: { in: ["planejado", "sequenciado", "em_execucao"] } } }),
      db.etiquetaIndustrial.count(),
      db.inspecaoQualidade.count({ where: { resultado: { in: ["pendente", "reprovado"] } } }),
    ]);

    const sectorLoad = setores.map((setor) => {
      const capacidade = setor.capacidades[0];
      const carga = capacidade?.cargaPlanejadaMin ?? 0;
      const total = capacidade?.capacidadeMin ?? 480;
      const percent = Math.round((carga / Math.max(total, 1)) * 100);
      return {
        sector: setor.nome,
        capacity: percent,
        status: percent >= 100 ? "gargalo" : percent >= 85 ? "atencao" : "operando",
        plannedMinutes: carga,
        availableMinutes: total,
      };
    });

    const operators = apontamentos.reduce<Record<string, any>>((acc, item) => {
      const key = item.usuario?.nome ?? "Sem operador";
      acc[key] ??= {
        name: key,
        sector: item.setor?.nome ?? "Fábrica",
        appointments: 0,
        minutes: 0,
        rework: 0,
      };
      acc[key].appointments += 1;
      acc[key].minutes += item.tempoMin ?? 0;
      acc[key].rework += item.retrabalho ? 1 : 0;
      return acc;
    }, {});

    const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      next.setDate(date.getDate() + 1);
      const dayItems = apontamentos.filter((item) => item.createdAt >= date && item.createdAt < next);
      return {
        day: date.toLocaleDateString("pt-BR", { weekday: "short" }),
        planejado: dayItems.length,
        produzido: dayItems.filter((item) => item.status === "concluido").length,
        retrabalho: dayItems.filter((item) => item.retrabalho).length,
      };
    });

    const cashflow = vendas.reduce<Record<string, any>>((acc, venda) => {
      const month = venda.dataVenda.toLocaleDateString("pt-BR", { month: "short" });
      acc[month] ??= { month, receita: 0, custo: 0, margem: 0 };
      acc[month].receita += toNumber(venda.valorTotal);
      acc[month].custo += toNumber(venda.valorTotal) * 0.68;
      acc[month].margem = acc[month].receita > 0 ? Math.round(((acc[month].receita - acc[month].custo) / acc[month].receita) * 100) : 0;
      return acc;
    }, {});

    const nowTime = now.getTime();
    const sla = ordens.reduce(
      (acc, os) => {
        if (!os.dataTermino) {
          acc.noDeadline += 1;
          return acc;
        }
        const late = os.dataTermino.getTime() < nowTime && !["concluida", "entregue", "cancelada"].includes(os.status);
        const near = os.dataTermino.getTime() - nowTime < 1000 * 60 * 60 * 48;
        if (late) acc.late += 1;
        else if (near) acc.attention += 1;
        else acc.onTime += 1;
        return acc;
      },
      { onTime: 0, attention: 0, late: 0, noDeadline: 0 },
    );

    const flow = [
      { label: "Orçamento", count: orcamentos },
      { label: "Venda", count: await db.venda.count({ where: { status: "em_andamento" } }) },
      { label: "Geração O.S.", count: await db.ordemServico.count({ where: { status: "pendente" } }) },
      { label: "Engenharia", count: await db.ordemServico.count({ where: { etapaAtual: "engenharia" } }) },
      { label: "PCP", count: planos },
      { label: "Setores", count: osEmAndamento },
      { label: "Expedição", count: await db.ordemServico.count({ where: { etapaAtual: "expedicao" } }) },
    ];

    res.json(
      response.success({
        osInProgress: osEmAndamento,
        productionToday: producaoDia,
        bottlenecks: sectorLoad.filter((s) => s.status === "gargalo"),
        averageTimeMinutes:
          apontamentos.length > 0
            ? Math.round(apontamentos.reduce((acc, a) => acc + (a.tempoMin ?? 0), 0) / apontamentos.length)
            : 0,
        efficiency: 91,
        stoppedSectors: sectorLoad.filter((s) => s.status === "parado"),
        rework,
        revenue: toNumber(faturamento._sum.valorTotal),
        criticalStock: materiaisCriticos.filter((m) => materialStatus(m) !== "ok").length,
        sectors: sectorLoad,
        operatorRanking: Object.values(operators).sort((a: any, b: any) => b.appointments - a.appointments),
        weeklyProduction: lastSevenDays,
        cashflow: Object.values(cashflow).slice(-6),
        sla,
        flow,
        serviceOrders: ordens.map(serializeOrder),
        recentRows: ordens.slice(0, 10).map((os) => ({
          id: os.numero,
          cliente: os.cliente?.razaoSocial ?? "-",
          descricao: serializeOrder(os).product,
          responsavel: os.etapaAtual,
          status: os.status,
          valor: os.venda ? Number(os.venda.valorTotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-",
          prazo: os.dataTermino ? os.dataTermino.toLocaleDateString("pt-BR") : "-",
        })),
        labelsCount: etiquetas,
        qualityPending: qualidade,
      }),
    );
  },
);

router.get(
  "/industrial/service-orders",
  requireAuth,
  auditLog({ action: "list", module: "industrial", table: "OrdemServico" }),
  async (req, res): Promise<void> => {
    const status = req.query.status as string | undefined;
    const sector = req.query.sector as string | undefined;
    const where: any = {};
    if (status) where.status = status;
    if (sector) where.etapaAtual = sector;

    const rows = await db.ordemServico.findMany({
      where,
      include: {
        cliente: true,
        venda: { include: { itens: { include: { produto: true } } } },
        etapas: true,
        apontamentos: true,
        etiquetas: true,
        inspecoesQualidade: true,
      },
      orderBy: [{ prioridade: "desc" }, { dataTermino: "asc" }],
      take: 200,
    });

    res.json(response.success(rows.map(serializeOrder)));
  },
);

router.patch(
  "/industrial/service-orders/:id/sector",
  requireAuth,
  auditLog({ action: "update", module: "industrial", table: "OrdemServico" }),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const schema = z.object({
      sector: z.string().min(1),
      observation: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);

    if (!id || !parsed.success) {
      res.status(400).json(response.error(parsed.success ? "ID inválido" : parsed.error.message, "VALIDATION_ERROR"));
      return;
    }

    const current = await db.ordemServico.findUnique({ where: { id } });
    if (!current) {
      res.status(404).json(response.error("OS não encontrada", "NOT_FOUND"));
      return;
    }

    const updated = await db.$transaction(async (tx) => {
      const row = await tx.ordemServico.update({
        where: { id },
        data: {
          etapaAtual: parsed.data.sector as any,
          status: parsed.data.sector === "entregue" ? "entregue" : "em_producao",
        },
      });

      await tx.oSHistoricoStatus.create({
        data: {
          osId: id,
          statusAnterior: current.etapaAtual,
          statusNovo: parsed.data.sector,
          observacao: parsed.data.observation ?? "Movimentação industrial por setor",
          usuarioId: (req as any).currentUser?.id,
        },
      });

      const existingStage = await tx.oSEtapaProducao.findFirst({
        where: { osId: id, etapa: parsed.data.sector as any },
      });

      if (existingStage) {
        await tx.oSEtapaProducao.update({
          where: { id: existingStage.id },
          data: {
            status: "em_andamento",
            dataInicio: new Date(),
            usuarioId: (req as any).currentUser?.id,
          },
        });
      } else {
        await tx.oSEtapaProducao.create({
          data: {
          osId: id,
          etapa: parsed.data.sector as any,
          status: "em_andamento",
          dataInicio: new Date(),
          usuarioId: (req as any).currentUser?.id,
          },
        });
      }

      return row;
    });

    res.json(response.success(updated));
  },
);

router.get(
  "/industrial/modules/:moduleKey",
  requireAuth,
  auditLog({ action: "list", module: "industrial", table: "ModuloIndustrial" }),
  async (req, res): Promise<void> => {
    const moduleKey = String(req.params.moduleKey);

    if (moduleKey === "estoque") {
      const rows = await db.material.findMany({ include: { fornecedor: true }, orderBy: { descricao: "asc" } });
      res.json(response.success(rows.map(serializeMaterial)));
      return;
    }

    if (moduleKey === "orcamentos" || moduleKey === "comercial") {
      const rows = await db.orcamento.findMany({
        include: { cliente: true, usuario: true, itens: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      res.json(
        response.success(
          rows.map((row) => ({
            id: row.numero,
            cliente: row.cliente?.razaoSocial ?? "-",
            vendedor: row.usuario?.nome ?? "-",
            itens: row.itens.length,
            status: row.status,
            valor: Number(row.valorTotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            prazo: row.validade ? row.validade.toLocaleDateString("pt-BR") : "-",
          })),
        ),
      );
      return;
    }

    if (moduleKey === "vendas") {
      const rows = await db.venda.findMany({
        include: { cliente: true, usuario: true, itens: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      res.json(
        response.success(
          rows.map((row) => ({
            id: row.numero,
            cliente: row.cliente?.razaoSocial ?? "-",
            vendedor: row.usuario?.nome ?? "-",
            itens: row.itens.length,
            status: row.status,
            valor: Number(row.valorTotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            data: row.dataVenda.toLocaleDateString("pt-BR"),
          })),
        ),
      );
      return;
    }

    if (moduleKey === "estrutura-produto") {
      const rows = await db.produtoEstrutura.findMany({
        include: { produto: true, material: true },
        orderBy: { updatedAt: "desc" },
        take: 100,
      });
      res.json(
        response.success(
          rows.map((row) => ({
            id: `${row.produto.codigo ?? row.produto.id}-${row.material.codigo}`,
            produto: row.produto.nome,
            material: row.material.descricao,
            quantidade: Number(row.quantidade),
            perda: `${Number(row.perdaPercentual)}%`,
            revisao: row.revisao,
            status: row.produto.status,
          })),
        ),
      );
      return;
    }

    if (moduleKey === "rh" || moduleKey === "usuarios-permissoes") {
      const rows = await db.usuario.findMany({
        include: { setor: true },
        orderBy: { nome: "asc" },
        take: 100,
      });
      res.json(
        response.success(
          rows.map((row) => ({
            id: row.id,
            nome: row.nome,
            email: row.email,
            perfil: row.tipo,
            setor: row.setor?.nome ?? "-",
            status: row.status,
          })),
        ),
      );
      return;
    }

    if (moduleKey === "configuracoes") {
      const rows = await db.permissao.findMany({
        include: { roles: true },
        orderBy: { modulo: "asc" },
        take: 100,
      });
      res.json(
        response.success(
          rows.map((row) => ({
            id: row.nome,
            modulo: row.modulo,
            descricao: row.descricao ?? "-",
            acoes: row.acoes.join(", "),
            perfis: row.roles.length,
            status: "ativo",
          })),
        ),
      );
      return;
    }

    if (moduleKey === "compras") {
      const rows = await db.compraPedido.findMany({
        include: { fornecedor: true, itens: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      res.json(
        response.success(
          rows.map((row) => ({
            id: row.numero,
            fornecedor: row.fornecedor?.razaoSocial ?? "-",
            itens: row.itens.length,
            status: row.status,
            valor: Number(row.valorTotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            prazo: row.previsaoEntrega ? row.previsaoEntrega.toLocaleDateString("pt-BR") : "-",
          })),
        ),
      );
      return;
    }

    if (moduleKey === "financeiro") {
      const [receber, pagar] = await Promise.all([
        db.contaReceber.findMany({ include: { cliente: true }, orderBy: { dataVencimento: "asc" }, take: 100 }),
        db.contaPagar.findMany({ orderBy: { dataVencimento: "asc" }, take: 100 }),
      ]);
      res.json(
        response.success([
          ...receber.map((row) => ({
            id: `CR-${row.id}`,
            entidade: row.cliente?.razaoSocial ?? "-",
            descricao: `Receber parcela ${row.parcelaNumero}/${row.totalParcelas}`,
            status: row.status,
            valor: Number(row.valorLiquido).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            prazo: row.dataVencimento.toLocaleDateString("pt-BR"),
          })),
          ...pagar.map((row) => ({
            id: `CP-${row.id}`,
            entidade: row.fornecedor ?? "-",
            descricao: row.descricao,
            status: row.status,
            valor: Number(row.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            prazo: row.dataVencimento.toLocaleDateString("pt-BR"),
          })),
        ]),
      );
      return;
    }

    if (moduleKey === "qualidade") {
      const rows = await db.inspecaoQualidade.findMany({
        include: { os: { include: { cliente: true } }, naoConformidades: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      res.json(
        response.success(
          rows.map((row) => ({
            id: `INSP-${row.id}`,
            cliente: row.os.cliente?.razaoSocial ?? "-",
            os: row.os.numero,
            etapa: row.etapa,
            status: row.resultado,
            naoConformidades: row.naoConformidades.length,
            data: row.inspecionadoEm ? row.inspecionadoEm.toLocaleDateString("pt-BR") : "-",
          })),
        ),
      );
      return;
    }

    if (moduleKey === "etiquetas") {
      const rows = await db.etiquetaIndustrial.findMany({
        include: { os: { include: { cliente: true } }, usuario: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      res.json(
        response.success(
          rows.map((row) => ({
            id: row.codigo,
            os: row.os.numero,
            cliente: row.os.cliente?.razaoSocial ?? "-",
            setor: row.setorAtual,
            status: row.impressoEm ? "impresso" : "pendente",
            impressora: row.impressora ?? "-",
            data: row.impressoEm ? row.impressoEm.toLocaleDateString("pt-BR") : "-",
          })),
        ),
      );
      return;
    }

    if (moduleKey === "assistencia-tecnica") {
      const rows = await db.assistenciaTecnicaChamado.findMany({
        include: { os: { include: { cliente: true } }, usuario: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      res.json(
        response.success(
          rows.map((row) => ({
            id: row.numero,
            cliente: row.os?.cliente?.razaoSocial ?? "-",
            assunto: row.assunto,
            prioridade: row.prioridade,
            status: row.status,
            aberto: row.abertoEm.toLocaleDateString("pt-BR"),
          })),
        ),
      );
      return;
    }

    const rows = await db.ordemServico.findMany({
      include: {
        cliente: true,
        venda: { include: { itens: { include: { produto: true } } } },
        etapas: true,
        apontamentos: true,
        etiquetas: true,
        inspecoesQualidade: true,
      },
      orderBy: [{ prioridade: "desc" }, { dataTermino: "asc" }],
      take: 100,
    });

    res.json(
      response.success(
        rows.map((os) => ({
          id: os.numero,
          cliente: os.cliente?.razaoSocial ?? "-",
          produto: serializeOrder(os).product,
          setor: os.etapaAtual,
          prioridade: os.prioridade,
          progresso: `${serializeOrder(os).progress}%`,
          prazo: os.dataTermino ? os.dataTermino.toLocaleDateString("pt-BR") : "-",
          status: os.status,
        })),
      ),
    );
  },
);

router.get(
  "/industrial/stock",
  requireAuth,
  auditLog({ action: "list", module: "estoque", table: "Material" }),
  async (_req, res): Promise<void> => {
    const rows = await db.material.findMany({
      include: { fornecedor: true },
      orderBy: [{ categoria: "asc" }, { descricao: "asc" }],
    });

    res.json(response.success(rows.map(serializeMaterial)));
  },
);

router.post(
  "/industrial/stock/movements",
  requireAuth,
  auditLog({ action: "create", module: "estoque", table: "EstoqueMovimentacao" }),
  async (req, res): Promise<void> => {
    const schema = z.object({
      materialId: z.number(),
      osId: z.number().optional(),
      tipo: z.enum(["entrada", "saida", "reserva", "consumo_os", "inventario", "ajuste", "estorno"]),
      quantidade: z.number().positive(),
      lote: z.string().optional(),
      localizacao: z.string().optional(),
      documento: z.string().optional(),
      observacao: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(response.error(parsed.error.message, "VALIDATION_ERROR"));
      return;
    }

    const userId = typeof (req as any).currentUser?.id === "number" ? (req as any).currentUser.id : undefined;
    const data = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const movement = await tx.estoqueMovimentacao.create({
        data: {
          materialId: data.materialId,
          osId: data.osId,
          usuarioId: userId,
          tipo: data.tipo,
          quantidade: data.quantidade,
          lote: data.lote,
          localizacao: data.localizacao,
          documento: data.documento,
          observacao: data.observacao,
        } satisfies Prisma.EstoqueMovimentacaoUncheckedCreateInput,
      });

      const material = await tx.material.findUnique({ where: { id: data.materialId } });
      const atual = toNumber(material?.estoqueAtual);
      const reservado = toNumber(material?.estoqueReservado);
      const qty = data.quantidade;
      const update: any = {};

      if (["entrada", "inventario"].includes(data.tipo)) update.estoqueAtual = data.tipo === "inventario" ? qty : atual + qty;
      if (["saida", "consumo_os"].includes(data.tipo)) update.estoqueAtual = atual - qty;
      if (data.tipo === "reserva") update.estoqueReservado = reservado + qty;
      if (data.tipo === "estorno") update.estoqueReservado = Math.max(reservado - qty, 0);

      const updatedMaterial = await tx.material.update({
        where: { id: data.materialId },
        data: update,
      });

      return { movement, material: serializeMaterial(updatedMaterial) };
    });

    res.status(201).json(response.success(result));
  },
);

router.get(
  "/industrial/pcp/plans",
  requireAuth,
  auditLog({ action: "list", module: "pcp", table: "PlanoProducao" }),
  async (_req, res): Promise<void> => {
    const rows = await db.planoProducao.findMany({
      include: { os: { include: { cliente: true } }, setor: true },
      orderBy: [{ dataPlanejada: "asc" }, { sequencia: "asc" }],
      take: 300,
    });

    res.json(
      response.success(
        rows.map((row) => ({
          id: row.id,
          osId: row.osId,
          osNumber: row.os.numero,
          client: row.os.cliente?.razaoSocial,
          sector: row.setor.nome,
          sequence: row.sequencia,
          plannedDate: row.dataPlanejada,
          start: row.inicioPrevisto,
          end: row.fimPrevisto,
          priority: row.prioridade,
          status: row.status,
          loadMinutes: row.cargaMin,
        })),
      ),
    );
  },
);

router.post(
  "/industrial/labels",
  requireAuth,
  auditLog({ action: "create", module: "etiquetas", table: "EtiquetaIndustrial" }),
  async (req, res): Promise<void> => {
    const schema = z.object({
      osId: z.number(),
      tipo: z.string().default("os"),
      impressora: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(response.error(parsed.error.message, "VALIDATION_ERROR"));
      return;
    }

    const os = await db.ordemServico.findUnique({ where: { id: parsed.data.osId }, include: { cliente: true } });
    if (!os) {
      res.status(404).json(response.error("OS não encontrada", "NOT_FOUND"));
      return;
    }

    const createdAt = Date.now();
    const codigo = `${os.numero}-${os.etapaAtual}-${createdAt}`;
    const qrPayload = JSON.stringify({
      osId: os.id,
      numero: os.numero,
      cliente: os.cliente?.razaoSocial,
      setorAtual: os.etapaAtual,
    });

    const etiqueta = await db.etiquetaIndustrial.create({
      data: {
        osId: os.id,
        usuarioId: (req as any).currentUser?.id,
        tipo: parsed.data.tipo,
        codigo,
        setorAtual: os.etapaAtual,
        qrPayload,
        barcode: codigo.replace(/[^A-Z0-9-]/gi, "").toUpperCase(),
        impressora: parsed.data.impressora,
        impressoEm: new Date(),
      },
    });

    res.status(201).json(response.success(etiqueta));
  },
);

router.post(
  "/industrial/seed",
  requireAuth,
  auditLog({ action: "seed", module: "industrial", table: "IndustrialSeed" }),
  async (_req, res): Promise<void> => {
    const result = await db.$transaction(async (tx) => {
      const setores = [];
      for (const nome of INDUSTRIAL_SECTORS) {
        setores.push(
          await tx.setor.upsert({
            where: { nome },
            update: { tipo: "producao" },
            create: { nome, tipo: "producao", descricao: `Setor fabril: ${nome}` },
          }),
        );
      }

      const materiais = [];
      for (const material of DEFAULT_MATERIALS) {
        materiais.push(
          await tx.material.upsert({
            where: { codigo: material.codigo },
            update: material,
            create: material,
          }),
        );
      }

      return { setores: setores.length, materiais: materiais.length };
    });

    res.status(201).json(response.success(result));
  },
);

export default router;
