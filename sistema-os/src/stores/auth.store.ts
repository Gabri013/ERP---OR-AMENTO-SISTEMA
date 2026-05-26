import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole =
  | "master"
  | "gerente"
  | "vendedor"
  | "producao"
  | "financeiro"
  | "engenharia"
  | "visualizador"
  | "projetista"
  | "dashboard_producao"
  | "corte"
  | "dobra"
  | "solda"
  | "refrigeracao"
  | "acabamento"
  | "finalizacao"
  | "montagem";

export interface AuthUser {
  id: string | number;
  nome: string;
  email: string;
  tipo: UserRole;
}

export interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  setUser: (
    user: AuthUser,
    token: string,
    refreshToken?: string | null,
  ) => void;
  setToken: (token: string, refreshToken?: string | null) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist<AuthStore>(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      setUser: (
        user: AuthUser,
        token: string,
        refreshToken: string | null = null,
      ) => set({ user, token, refreshToken }),
      setToken: (token: string, refreshToken: string | null = null) =>
        set((state: AuthStore) => ({
          token,
          refreshToken: refreshToken ?? state.refreshToken,
        })),
      logout: () => set({ user: null, token: null, refreshToken: null }),
      hasRole: (...roles: UserRole[]) =>
        roles.includes(
          (get().user?.tipo as UserRole) ?? ("visualizador" as UserRole),
        ),
      isAdmin: () => ["master", "gerente"].includes(get().user?.tipo ?? ""),
    }),
    { name: "erp-auth" },
  ),
);
