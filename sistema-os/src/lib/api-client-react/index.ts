/**
 * Complete API Client Stub for ERP - Sistema OS
 * This file exports ALL functions/types that the pages import from "@workspace/api-client-react".
 *
 * Real calls are made when the backend route exists.
 * Otherwise, they return safe dummy data so the UI builds and loads.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";

const API_URL =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
  "https://erp-backend-evq2.onrender.com";

function unwrap<T>(payload: any): T {
  if (payload && typeof payload === "object" && "success" in payload) {
    return (payload.data ?? payload) as T;
  }
  return payload as T;
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken =
    useAuthStore.getState().refreshToken ||
    localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;

  const payload = await res.json().catch(() => null);
  const data = unwrap<any>(payload);
  if (!data?.accessToken) return null;

  useAuthStore.getState().setToken(data.accessToken, data.refreshToken);
  localStorage.setItem("authToken", data.accessToken);
  if (data.refreshToken)
    localStorage.setItem("refreshToken", data.refreshToken);
  if (data.user) {
    useAuthStore
      .getState()
      .setUser(data.user, data.accessToken, data.refreshToken);
  }

  return data.accessToken;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Ensure all calls go through /api (backend mounts router at /api)
  const normalizedPath = path.startsWith("/api")
    ? path
    : `/api${path.startsWith("/") ? "" : "/"}${path}`;

  // Add Authorization header if token exists
  const token =
    useAuthStore.getState().token || localStorage.getItem("authToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const execute = async (authToken?: string | null) => {
    const requestHeaders = { ...headers };
    if (authToken) requestHeaders["Authorization"] = `Bearer ${authToken}`;
    return fetch(`${API_URL}${normalizedPath}`, {
      ...options,
      headers: requestHeaders,
      credentials: "include",
    });
  };

  let res = await execute(token);

  if (res.status === 401 && token) {
    const nextToken = await tryRefreshToken();
    if (nextToken) {
      res = await execute(nextToken);
    } else {
      // Refresh failed — clear auth and redirect to login
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      useAuthStore.getState().logout();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
      throw new Error("Sessão expirada. Faça login novamente.");
    }
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      payload?.error?.message || payload?.error || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return unwrap<T>(payload);
}

// ==================== TYPES ====================
export type AuthUser = {
  id: string | number;
  nome: string;
  email: string;
  tipo?: string;
  role?: string;
};
export type Cliente = any;
export type Produto = any;
export type Usuario = any;

// ==================== AUTH ====================
export function setAuthTokenGetter(_: any) {}
export function getGetMeQueryKey() {
  return ["me"];
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => {
      const data = await apiFetch<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify(d.data || d),
      });
      if (data?.token) {
        localStorage.setItem("authToken", data.token);
        useAuthStore.getState().setToken(data.token, data.refreshToken);
      }
      if (data?.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      if (data?.id || data?.user) {
        useAuthStore
          .getState()
          .setUser(data.user ?? data, data.token, data.refreshToken);
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      useAuthStore.getState().logout();
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
export function useGetMe() {
  return useQuery<any>({
    queryKey: ["me"],
    queryFn: async () => {
      // If no token stored, don't even call the backend
      const token =
        useAuthStore.getState().token || localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No auth token");
      }
      const user = await apiFetch<any>("/auth/me");
      const currentToken =
        useAuthStore.getState().token ||
        localStorage.getItem("authToken") ||
        "";
      useAuthStore
        .getState()
        .setUser(user, currentToken, useAuthStore.getState().refreshToken);
      return user;
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// ==================== CLIENTES ====================
export function useListClientes(params?: { q?: string } | string) {
  const q = typeof params === "string" ? params : params?.q;
  return useQuery<any[]>({
    queryKey: ["clientes", q],
    queryFn: () =>
      apiFetch<any[]>(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });
}
export function createCliente(d: any) {
  return apiFetch("/clientes", { method: "POST", body: JSON.stringify(d) });
}
export function updateCliente(id: string | number, d: any) {
  return apiFetch(`/clientes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(d),
  });
}
export function deleteCliente(id: string | number) {
  return apiFetch(`/clientes/${id}`, { method: "DELETE" });
}
export function getListClientesQueryKey() {
  return ["clientes"];
}

// ==================== PRODUTOS ====================
export function useListProdutos(params?: { q?: string } | string) {
  const q = typeof params === "string" ? params : params?.q;
  return useQuery<any[]>({
    queryKey: ["produtos", q],
    queryFn: () =>
      apiFetch<any[]>(`/produtos${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });
}
export function createProduto(d: any) {
  return apiFetch("/produtos", { method: "POST", body: JSON.stringify(d) });
}
export function updateProduto(id: string | number, d: any) {
  return apiFetch(`/produtos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(d),
  });
}
export function deleteProduto(id: string | number) {
  return apiFetch(`/produtos/${id}`, { method: "DELETE" });
}
export function getListProdutosQueryKey() {
  return ["produtos"];
}

// ==================== ORÇAMENTOS ====================
export function useListOrcamentos(params?: { status?: string }) {
  const status = params?.status;
  return useQuery<any[]>({
    queryKey: ["orcamentos", status],
    queryFn: () =>
      apiFetch<any[]>(
        `/orcamentos${status ? `?status=${encodeURIComponent(status)}` : ""}`,
      ),
  });
}
export function useGetOrcamento(id: string | number) {
  return useQuery<any | null>({
    queryKey: ["orcamento", id],
    queryFn: () => apiFetch(`/orcamentos/${id}`).catch(() => null),
    enabled: !!id,
  });
}
export function useConverterOrcamento(options?: { mutation?: any }) {
  return useMutation<any, unknown, { id: string | number }>({
    mutationFn: (d) =>
      apiFetch(`/orcamentos/${d.id}/converter`, { method: "POST" }),
    ...(options?.mutation ?? {}),
  });
}
export function updateOrcamento(id: string | number, d: any) {
  return apiFetch(`/orcamentos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(d),
  });
}
export function deleteOrcamento(id: string | number) {
  return apiFetch(`/orcamentos/${id}`, { method: "DELETE" });
}
export function createOrcamento(d: any) {
  return apiFetch("/orcamentos", { method: "POST", body: JSON.stringify(d) });
}
export function getListOrcamentosQueryKey() {
  return ["orcamentos"];
}

// ==================== VENDAS ====================
export function useListVendas(params?: { status?: string }) {
  const status = params?.status;
  return useQuery<any[]>({
    queryKey: ["vendas", status],
    queryFn: () =>
      apiFetch<any[]>(
        `/vendas${status ? `?status=${encodeURIComponent(status)}` : ""}`,
      ),
  });
}
export function useGetVenda(id: string | number) {
  return useQuery<any>({
    queryKey: ["venda", id],
    queryFn: () => apiFetch(`/vendas/${id}`),
    enabled: !!id,
  });
}
export function useGerarOsParaVenda(options?: { mutation?: any }) {
  return useMutation<any, unknown, { id: string | number }>({
    mutationFn: (d) =>
      apiFetch(`/vendas/${d.id}/gerar-os`, { method: "POST" }),
    ...(options?.mutation ?? {}),
  });
}
export function createVenda(d: any) {
  return apiFetch("/vendas", { method: "POST", body: JSON.stringify(d) });
}
export function getListVendasQueryKey() {
  return ["vendas"];
}

// ==================== OS ====================
export function useListOS(params?: { status?: string; etapa?: string }) {
  const status = params?.status;
  const etapa = params?.etapa;
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (etapa) qs.set("etapa", etapa);
  const qstr = qs.toString();
  return useQuery<any[]>({
    queryKey: ["os", status, etapa],
    queryFn: () => apiFetch<any[]>(`/os${qstr ? `?${qstr}` : ""}`),
  });
}
export function useGetOS(id: string | number) {
  return useQuery<any>({
    queryKey: ["os", id],
    queryFn: () => apiFetch(`/os/${id}`),
    enabled: !!id,
  });
}
export function useAvancarEtapaOS(options?: { mutation?: any }) {
  return useMutation({
    mutationFn: (d: any) =>
      apiFetch(`/os/${d.id}/avancar`, {
        method: "POST",
        body: JSON.stringify(d.data ?? d),
      }),
    ...(options?.mutation ?? {}),
  });
}
export function addObservacaoOS(osId: string | number, body: any) {
  return apiFetch(`/os/${osId}/observacoes`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function getListOSQueryKey() {
  return ["os"];
}
export function useGetOSImprimir(id: string | number) {
  return useQuery<any>({
    queryKey: ["os-imprimir", id],
    queryFn: () => apiFetch<any>(`/os/${id}/imprimir`),
    enabled: !!id,
  });
}

// ==================== USUARIOS ====================
export function useListUsuarios() {
  return useQuery<any[]>({
    queryKey: ["usuarios"],
    queryFn: () => apiFetch<any[]>("/usuarios"),
  });
}
export function createUsuario(d: any) {
  return apiFetch("/usuarios", { method: "POST", body: JSON.stringify(d) });
}
export function updateUsuario(id: string | number, d: any) {
  return apiFetch(`/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(d),
  });
}
export function deleteUsuario(id: string | number) {
  return apiFetch(`/usuarios/${id}`, { method: "DELETE" });
}
export function getListUsuariosQueryKey() {
  return ["usuarios"];
}

// ==================== CONTAS ====================
export function useListContasPagar(params?: { status?: string }) {
  const status = params?.status;
  const qstr = status ? `?status=${encodeURIComponent(status)}` : "";
  return useQuery<any[]>({
    queryKey: ["contas-pagar", status],
    queryFn: () => apiFetch<any[]>(`/financeiro/contas-pagar${qstr}`),
  });
}
export function createContaPagar(d: any) {
  return apiFetch("/financeiro/contas-pagar", {
    method: "POST",
    body: JSON.stringify(d),
  });
}
export function pagarContaPagar(id: string | number, d?: any) {
  return apiFetch(`/financeiro/contas-pagar/${id}/pagar`, {
    method: "POST",
    body: JSON.stringify(d),
  });
}
export function getListContasPagarQueryKey() {
  return ["contas-pagar"];
}

export function useListContasReceber(params?: { status?: string }) {
  const status = params?.status;
  const qstr = status ? `?status=${encodeURIComponent(status)}` : "";
  return useQuery<any[]>({
    queryKey: ["contas-receber", status],
    queryFn: () => apiFetch<any[]>(`/financeiro/contas-receber${qstr}`),
  });
}
export function pagarContaReceber(id: string | number, d: any) {
  return apiFetch(`/financeiro/contas-receber/${id}/pagar`, {
    method: "POST",
    body: JSON.stringify(d),
  });
}
export function getListContasReceberQueryKey() {
  return ["contas-receber"];
}

// ==================== DASHBOARD ====================
export function useGetDashboardStats() {
  return useQuery<any>({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<any>("/dashboard/stats"),
    retry: 1,
  });
}
export function useGetOsPorStatus() {
  return useQuery<any>({
    queryKey: ["os-por-status"],
    queryFn: () => apiFetch<any[]>("/dashboard/os-por-status").catch(() => []),
  });
}
export function useGetVendasRecentes() {
  return useQuery<any>({
    queryKey: ["vendas-recentes"],
    queryFn: () =>
      apiFetch<any[]>("/dashboard/vendas-recentes").catch(() => []),
  });
}
export function useGetOsAtrasadas() {
  return useQuery<any>({
    queryKey: ["os-atrasadas"],
    queryFn: () => apiFetch<any[]>("/dashboard/os-atrasadas").catch(() => []),
  });
}

// ==================== KANBAN ====================
export function useGetKanbanProducao() {
  return useQuery<any>({
    queryKey: ["kanban-producao"],
    queryFn: () => apiFetch<any>("/kanban/producao"),
    refetchInterval: 30000,
  });
}

export function useGetKanbanComercial() {
  return useQuery<any>({
    queryKey: ["kanban-comercial"],
    queryFn: () => apiFetch<any>("/kanban/comercial").catch(() => ({})),
    refetchInterval: 30000,
  });
}

export function useMoveOSKanban() {
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/os/${id}/kanban`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  });
}

// Fallback
export const apiClient = {};
