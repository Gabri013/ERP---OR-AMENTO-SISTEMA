import { Router, Request, Response } from "express";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { validateParams } from "../../middleware/validateZod";
import { GetOSParams } from "../../schemas";
import { generateOSPDF } from "../../lib/pdf";
import { response } from "../../utils/response";
import { pdfQueue } from "../../lib/queue";

export const pdfRouter = Router();

pdfRouter.get(
  "/os/:id/pdf",
  requireAuth,
  checkPermission("os", "visualizar"),
  validateParams(GetOSParams),
  async (req: Request, res: Response): Promise<void> => {
    const p = GetOSParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    try {
      const pdfBuffer = await generateOSPDF(Number(p.data.id));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=os-${p.data.id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json(response.error("Erro ao gerar PDF", "PDF_ERROR"));
    }
  },
);

pdfRouter.post(
  "/os/:id/pdf-job",
  requireAuth,
  checkPermission("os", "visualizar"),
  validateParams(GetOSParams),
  async (req: Request, res: Response): Promise<void> => {
    const p = GetOSParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const job = await pdfQueue.add({ type: "os", id: Number(p.data.id) });
    res.status(202).json(
      response.success({ jobId: String((job as any).id), status: "queued" }),
    );
  },
);
