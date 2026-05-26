/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";

export interface Notification {
  id: string | number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt: string;
  link?: string;
}

export interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  add: (n: Notification) => void;
  markRead: (id: string | number) => void;
  markAllRead: () => void;
  setAll: (ns: Notification[]) => void;
}

export const useNotificationStore = create<NotificationStore>((set: any) => ({
  notifications: [] as Notification[],
  unreadCount: 0 as number,
  add: (n: Notification) =>
    set((s: NotificationStore) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + (n.lida ? 0 : 1),
    })),
  markRead: (id: string | number) =>
    set((s: NotificationStore) => ({
      notifications: s.notifications.map((x: Notification) =>
        x.id === id ? { ...x, lida: true } : x,
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllRead: () =>
    set((s: NotificationStore) => ({
      notifications: s.notifications.map((x: Notification) => ({
        ...x,
        lida: true,
      })),
      unreadCount: 0,
    })),
  setAll: (ns: Notification[]) =>
    set({
      notifications: ns,
      unreadCount: ns.filter((x: Notification) => !x.lida).length,
    }),
}));
