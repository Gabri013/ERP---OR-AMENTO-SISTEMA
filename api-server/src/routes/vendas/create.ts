import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { validateBody } from "../../middleware/validateZod";
import { CreateVendaBody } from "../../schemas";
import { response } from "../../utils/response";
import { getNextVendaNum, serializeVenda } from "./utils";
import { sendVendaEmail } from "../../lib/email";

export const createRouter = Router();

createRouter.post(
  "/vendas",
  requireAuth,
  checkPermission("vendas", "criar"),
  validateBody(CreateVendaBody),
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).currentUser?.id ?? 1;
    const { itens, ...vendaData } = req.body as any;
    const numero = await getNextVendaNum();

    const valorTotal = itens.reduce(
      (sum: number, i: any) => sum + Number(i.valorUnitario) * Number(i.quantidade),
      0,
    );

    const dataVendaDate = new Date(vendaData.dataVenda as string);

    const venda = await db.venda.create({
      data: {
        numero,
        orcamentoId: vendaData.orcamentoId ?? null,
        clienteId: vendaData.clienteId,
        usuarioId: userId,
        dataVenda: dataVendaDate,
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

    const totalLiquido = valorTotal - Number(vendaData.desconto ?? 0);
    const numParcelas = vendaData.numParcelas ?? 1;
    const valorParcela = totalLiquido / numParcelas;

    for (let i = 1; i <= numParcelas; i += 1) {
      await db.contaReceber.create({
        data: {
          vendaId: venda.id,
          clienteId: venda.clienteId,
          parcelaNumero: i,
          totalParcelas: numParcelas,
          valorBruto: valorParcela,
          valorLiquido: valorParcela,
          valorRecebido: 0,
          dataVencimento: dataVendaDate,
          formaPagamento: vendaData.formaPagamento ?? "pix",
          status: "PENDENTE",
        },
      });
    }

    const cliente = await db.cliente.findUnique({ where: { id: venda.clienteId } });
    if (cliente?.email) {
      sendVendaEmail(venda.id, cliente.email, numero).catch(console.error);
    }

    res.status(201).json(response.success(serializeVenda(venda, cliente)));
  },
);
