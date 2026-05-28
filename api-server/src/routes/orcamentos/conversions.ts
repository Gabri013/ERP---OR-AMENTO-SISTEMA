import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { validateParams } from "../../middleware/validateZod";
import { ConverterOrcamentoParams } from "../../schemas";
import { auditLog } from "../../middleware/audit";
import { response } from "../../utils/response";
import { getNextVendaNum } from "./utils";
import { canTransitionOrcamento } from "../../lib/stateMachine";

export const conversionsRouter = Router();

conversionsRouter.post(
  "/orcamentos/:id/converter",
  requireAuth,
  checkPermission("orcamentos", "converter"),
  validateParams(ConverterOrcamentoParams),
  auditLog({ action: "converter", module: "orcamentos", table: "Orcamento" }),
  async (req: Request, res: Response): Promise<void> => {
    const p = ConverterOrcamentoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const id = Number(p.data.id);
    const orc = await db.orcamento.findUnique({ where: { id } });
    if (!orc) {
      res.status(404).json(response.error("Orçamento não encontrado", "NOT_FOUND"));
      return;
    }
    if (orc.status === "convertido") {
      res.status(400).json(response.error("Orçamento já convertido", "ALREADY_CONVERTED"));
      return;
    }

    const validation = canTransitionOrcamento(orc.status, "convertido");
    if (!validation.valid) {
      res.status(400).json(response.error(validation.error || "Transição inválida", "INVALID_TRANSITION"));
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

    const orcItens = await db.orcamentoItem.findMany({ where: { orcamentoId: orc.id } });
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

    await db.orcamento.update({ where: { id: orc.id }, data: { status: "convertido" } });

    const cliente = await db.cliente.findUnique({ where: { id: venda.clienteId } });
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
        createdAt: venda.createdAt instanceof Date ? venda.createdAt.toISOString() : venda.createdAt,
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
              createdAt: cliente.createdAt instanceof Date ? cliente.createdAt.toISOString() : cliente.createdAt,
            }
          : undefined,
      }),
    );
  },
);
