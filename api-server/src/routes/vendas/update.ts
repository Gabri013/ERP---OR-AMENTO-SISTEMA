import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth, requireRoles, SALES_ROLES } from "../../middleware/auth";
import { validateBody, validateParams } from "../../middleware/validateZod";
import { UpdateVendaBody, UpdateVendaParams } from "../../schemas";
import { response } from "../../utils/response";
import { serializeVenda } from "./utils";

export const updateRouter = Router();

updateRouter.patch(
  "/vendas/:id",
  requireAuth,
  requireRoles(SALES_ROLES),
  validateParams(UpdateVendaParams),
  validateBody(UpdateVendaBody),
  async (req: Request, res: Response): Promise<void> => {
    const p = UpdateVendaParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const data: any = { ...req.body };
    if (data.valorTotal !== undefined) data.valorTotal = Number(data.valorTotal);
    if (data.desconto !== undefined) data.desconto = Number(data.desconto);

    try {
      const row = await db.venda.update({ where: { id: Number(p.data.id) }, data });
      const cliente = await db.cliente.findUnique({ where: { id: row.clienteId } });
      res.json(response.success(serializeVenda(row, cliente)));
    } catch {
      res.status(404).json(response.error("Venda não encontrada", "NOT_FOUND"));
    }
  },
);
