import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { verifyUserToken } from "./jwt";
import { db } from "./prisma";
import { logger } from "./logger";

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        /\.vercel\.app$/,
      ],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.replace("Bearer ", "") ?? "");

      if (!token) {
        return next(new Error("Token não fornecido"));
      }

      const claims = await verifyUserToken(token);
      if (!claims) {
        return next(new Error("Token inválido"));
      }

      const user = await db.usuario.findUnique({
        where: { id: claims.sub },
        select: { id: true, nome: true, email: true, tipo: true, status: true },
      });

      if (!user || user.status !== "ativo") {
        return next(new Error("Usuário inativo"));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error("Erro de autenticação"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    if (!user) return;

    socket.join(`user:${user.id}`);
    socket.join(`role:${user.tipo}`);

    logger.info({ userId: user.id, tipo: user.tipo }, "Socket connected");

    socket.on("disconnect", () => {
      logger.info({ userId: user.id }, "Socket disconnected");
    });
  });

  logger.info("Socket.IO initialized");
  return io;
}

export function getIO(): SocketServer | null {
  return io;
}

export function emitToUser(userId: number, event: string, data: unknown) {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitToRole(role: string, event: string, data: unknown) {
  io?.to(`role:${role}`).emit(event, data);
}

export function emitToAll(event: string, data: unknown) {
  io?.emit(event, data);
}

export async function notificarUsuario(
  usuarioId: number,
  titulo: string,
  mensagem: string,
  tipo: string,
  link?: string,
) {
  try {
    const notificacao = await (db as any).notificacao.create({
      data: { usuarioId, titulo, mensagem, tipo, link },
    });

    emitToUser(usuarioId, "notificacao", {
      id: notificacao.id,
      titulo: notificacao.titulo,
      mensagem: notificacao.mensagem,
      tipo: notificacao.tipo,
      lida: notificacao.lida,
      link: notificacao.link,
      createdAt: notificacao.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Erro ao criar/emitir notificação");
  }
}
