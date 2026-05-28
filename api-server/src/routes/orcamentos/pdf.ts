import { Router, Request, Response } from "express";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { validateParams } from "../../middleware/validateZod";
import { GetOrcamentoParams } from "../../schemas";
import { generateOrcamentoPDF } from "../../lib/pdf";
import { response } from "../../utils/response";

export const pdfRouter = Router();

pdfRouter.get(
  "/orcamentos/:id/pdf",
  requireAuth,
  checkPermission("orcamentos", "visualizar"),
  validateParams(GetOrcamentoParams),
  async (req: Request, res: Response): Promise<void> => {
    const p = GetOrcamentoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    try {
      const pdfBuffer = await generateOrcamentoPDF(Number(p.data.id));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=orcamento-${p.data.id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json(response.error("Erro ao gerar PDF", "PDF_ERROR"));
    }
  },
);
