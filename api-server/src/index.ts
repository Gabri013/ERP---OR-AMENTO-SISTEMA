import dotenv from "dotenv";
import app from "./app";

// Carregar .env (funciona local e no Vercel)
dotenv.config({ path: process.env.VERCEL ? undefined : "../../../.env" });

// Para Vercel Serverless: exportar o app como handler
// Para desenvolvimento local: o listen continua abaixo
export default app;

// Local development only
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const rawPort = process.env["PORT"] || "5000";
  const port = Number(rawPort);

  if (!Number.isNaN(port) && port > 0) {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  }
}
