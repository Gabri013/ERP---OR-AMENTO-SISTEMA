import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";

let socket: Socket | null = null;

export function connectSocket(): Socket | null {
  const token =
    useAuthStore.getState().token || localStorage.getItem("authToken");
  const wsUrl =
    (import.meta as any).env?.VITE_WS_URL?.replace(/\/$/, "") ||
    "wss://erp-backend-evq2.onrender.com";

  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(wsUrl, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    timeout: 20000,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.info("[Socket] Connected:", socket?.id);
  });

  socket.on("disconnect", (reason: Socket.DisconnectReason) => {
    console.warn("[Socket] Disconnected:", reason);
  });

  socket.on("connect_error", (err: Error) => {
    console.error("[Socket] Connection error:", err.message);
  });

  socket.on("notificacao", (data: any) => {
    useNotificationStore.getState().add({
      id: data.id ?? String(Date.now()),
      tipo: data.tipo ?? "info",
      titulo: data.titulo,
      mensagem: data.mensagem,
      lida: data.lida ?? false,
      createdAt: data.createdAt ?? new Date().toISOString(),
      link: data.link,
    });
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
