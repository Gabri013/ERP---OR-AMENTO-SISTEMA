import { emailQueue, pdfQueue, reportQueue } from "../lib/queue";
import { db } from "../lib/prisma";
import { logger } from "../lib/logger";
import { sendEmail } from "../lib/email";
import { generateOrcamentoPDF, generateOSPDF } from "../lib/pdf";

emailQueue.process(async (job) => {
  const { type, clienteEmail, numero } = job.data;
  const subject =
    type === "orcamento"
      ? `Orçamento #${numero} - ERP Cozinca`
      : type === "os"
      ? `Ordem de Serviço #${numero} - ERP Cozinca`
      : `Venda #${numero} - ERP Cozinca`;

  const html = `<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${subject}</h2>
      <p>Prezado cliente,</p>
      <p>O documento relacionado foi criado com sucesso no ERP Cozinca.</p>
      <p>Verifique o sistema para mais detalhes.</p>
      <br>
      <p>Atenciosamente,<br>Equipe ERP Cozinca</p>
    </body></html>`;

  await sendEmail({
    to: clienteEmail,
    subject,
    html,
    text: `${subject} criado com sucesso.`,
  });

  return { sent: true };
});

pdfQueue.process(async (job) => {
  const { type, id } = job.data;

  if (type === "os") {
    const buffer = await generateOSPDF(id);
    return { type, id, bufferLength: buffer.length };
  }

  const buffer = await generateOrcamentoPDF(id);
  return { type, id, bufferLength: buffer.length };
});

reportQueue.process(async (job) => {
  if (job.data.type === "financeiro") {
    const saldo = await db.contaReceber.findMany({
      where: { status: "PENDENTE" },
    });
    return {
      type: job.data.type,
      count: saldo.length,
      query: job.data.query || null,
    };
  }

  const vendas = await db.venda.findMany();

  return {
    type: job.data.type,
    count: vendas.length,
    query: job.data.query || null,
  };
});

emailQueue.on("failed", (job, err) => {
  logger.error({ job: (job as any)?.id, err }, "Email queue job failed");
});

pdfQueue.on("failed", (job, err) => {
  logger.error({ job: (job as any)?.id, err }, "PDF queue job failed");
});

reportQueue.on("failed", (job, err) => {
  logger.error({ job: (job as any)?.id, err }, "Report queue job failed");
});
