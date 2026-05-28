import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody, validateParams } from "../middleware/validateZod";
import { response } from "../utils/response";
import { emailQueue, pdfQueue, reportQueue } from "../lib/queue";
import { z } from "zod";

const router = Router();

const CreateReportJobBody = z.object({
  type: z.enum(["vendas", "financeiro"]),
  userId: z.number().optional(),
  query: z.record(z.any()).optional(),
});

router.get(
  "/jobs/:jobId",
  requireAuth,
  validateParams(z.object({ jobId: z.string() })),
  async (req: Request, res: Response): Promise<void> => {
    const jobId = String(req.params.jobId);
    const queues = [emailQueue, pdfQueue, reportQueue];

    for (const queue of queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        res.json(
          response.success({
            id: String((job as any).id),
            state: (job as any).state ?? "unknown",
            data: (job as any).data,
            failedReason: (job as any).failedReason ?? (job as any).failedReason,
            result: (job as any).returned ?? (job as any).returnvalue ?? null,
          }),
        );
        return;
      }
    }

    res.status(404).json(response.error("Job não encontrado", "NOT_FOUND"));
  },
);

router.post(
  "/jobs/reports",
  requireAuth,
  validateBody(CreateReportJobBody),
  async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as { type: "vendas" | "financeiro"; userId?: number; query?: Record<string, unknown> };
    const job = await reportQueue.add(payload);
    res.status(202).json(
      response.success({ jobId: String((job as any).id), status: "queued" }),
    );
  },
);

export default router;
