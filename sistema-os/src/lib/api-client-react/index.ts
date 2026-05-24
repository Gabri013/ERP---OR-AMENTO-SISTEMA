/**
 * Complete API Client Stub for ERP - Sistema OS
 * This file exports ALL functions/types that the pages import from "@workspace/api-client-react".
 * 
 * Real calls are made when the backend route exists.
 * Otherwise, they return safe dummy data so the UI builds and loads.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Ensure all calls go through /api (backend mounts router at /api)
  const normalizedPath = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(`${API_URL}${normalizedPath}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
}

// ==================== TYPES ====================
export type AuthUser = { id: string; nome: string; email: string; role?: string };
export type Cliente = any;
export type Produto = any;
export type Usuario = any;

// ==================== AUTH ====================
export function setAuthTokenGetter(_: any) {}
export function getGetMeQueryKey() { return ['me']; }

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(d.data || d) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => apiFetch('/auth/logout', { method: 'POST' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }) });
}
export function useGetMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      // If no token stored, don't even call the backend
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No auth token");
      }
      return apiFetch<any>('/auth/me');
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// ==================== CLIENTES ====================
export function useListClientes(q?: string) {
  return useQuery({ queryKey: ['clientes', q], queryFn: () => apiFetch<any[]>(`/clientes${q ? `?q=${q}` : ''}`).catch(() => []) });
}
export function createCliente(d: any) { return apiFetch('/clientes', { method: 'POST', body: JSON.stringify(d) }); }
export function updateCliente(id: string, d: any) { return apiFetch(`/clientes/${id}`, { method: 'PATCH', body: JSON.stringify(d) }); }
export function deleteCliente(id: string) { return apiFetch(`/clientes/${id}`, { method: 'DELETE' }); }
export function getListClientesQueryKey() { return ['clientes']; }

// ==================== PRODUTOS ====================
export function useListProdutos(q?: string) {
  return useQuery({ queryKey: ['produtos', q], queryFn: () => apiFetch<any[]>(`/produtos${q ? `?q=${q}` : ''}`).catch(() => []) });
}
export function createProduto(d: any) { return apiFetch('/produtos', { method: 'POST', body: JSON.stringify(d) }); }
export function updateProduto(id: string, d: any) { return apiFetch(`/produtos/${id}`, { method: 'PATCH', body: JSON.stringify(d) }); }
export function deleteProduto(id: string) { return apiFetch(`/produtos/${id}`, { method: 'DELETE' }); }
export function getListProdutosQueryKey() { return ['produtos']; }

// ==================== ORÇAMENTOS ====================
export function useListOrcamentos() { return useQuery({ queryKey: ['orcamentos'], queryFn: () => apiFetch<any[]>('/orcamentos').catch(() => []) }); }
export function useGetOrcamento(id: string) { return useQuery({ queryKey: ['orcamento', id], queryFn: () => apiFetch(`/orcamentos/${id}`).catch(() => null) }); }
export function useConverterOrcamento() { return useMutation({ mutationFn: (id: string) => apiFetch(`/orcamentos/${id}/converter`, { method: 'POST' }) }); }
export function updateOrcamento(id: string, d: any) { return apiFetch(`/orcamentos/${id}`, { method: 'PATCH', body: JSON.stringify(d) }); }
export function deleteOrcamento(id: string) { return apiFetch(`/orcamentos/${id}`, { method: 'DELETE' }); }
export function createOrcamento(d: any) { return apiFetch('/orcamentos', { method: 'POST', body: JSON.stringify(d) }); }
export function getListOrcamentosQueryKey() { return ['orcamentos']; }

// ==================== VENDAS ====================
export function useListVendas() { return useQuery({ queryKey: ['vendas'], queryFn: () => apiFetch<any[]>('/vendas').catch(() => []) }); }
export function useGetVenda(id: string) { return useQuery({ queryKey: ['venda', id], queryFn: () => apiFetch(`/vendas/${id}`).catch(() => null) }); }
export function useGerarOsParaVenda() { return useMutation({ mutationFn: (id: string) => apiFetch(`/vendas/${id}/gerar-os`, { method: 'POST' }) }); }
export function createVenda(d: any) { return apiFetch('/vendas', { method: 'POST', body: JSON.stringify(d) }); }
export function getListVendasQueryKey() { return ['vendas']; }

// ==================== OS ====================
export function useListOS() { return useQuery({ queryKey: ['os'], queryFn: () => apiFetch<any[]>('/os').catch(() => []) }); }
export function useGetOS(id: string) { return useQuery({ queryKey: ['os', id], queryFn: () => apiFetch(`/os/${id}`).catch(() => null) }); }
export function useAvancarEtapaOS() { return useMutation({ mutationFn: (d: any) => apiFetch(`/os/${d.id}/avancar`, { method: 'POST', body: JSON.stringify(d) }) }); }
export function addObservacaoOS() { return useMutation({ mutationFn: (d: any) => apiFetch(`/os/${d.osId}/observacao`, { method: 'POST', body: JSON.stringify(d) }) }); }
export function getListOSQueryKey() { return ['os']; }

// ==================== USUARIOS ====================
export function useListUsuarios() { return useQuery({ queryKey: ['usuarios'], queryFn: () => apiFetch<any[]>('/usuarios').catch(() => []) }); }
export function createUsuario(d: any) { return apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(d) }); }
export function updateUsuario(id: string, d: any) { return apiFetch(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(d) }); }
export function deleteUsuario(id: string) { return apiFetch(`/usuarios/${id}`, { method: 'DELETE' }); }
export function getListUsuariosQueryKey() { return ['usuarios']; }

// ==================== CONTAS ====================
export function useListContasPagar() { return useQuery({ queryKey: ['contas-pagar'], queryFn: () => apiFetch<any[]>('/contas-pagar').catch(() => []) }); }
export function createContaPagar(d: any) { return apiFetch('/contas-pagar', { method: 'POST', body: JSON.stringify(d) }); }
export function pagarContaPagar(id: string, d: any) { return apiFetch(`/contas-pagar/${id}/pagar`, { method: 'POST', body: JSON.stringify(d) }); }
export function getListContasPagarQueryKey() { return ['contas-pagar']; }

export function useListContasReceber() { return useQuery({ queryKey: ['contas-receber'], queryFn: () => apiFetch<any[]>('/contas-receber').catch(() => []) }); }
export function pagarContaReceber(id: string, d: any) { return apiFetch(`/contas-receber/${id}/pagar`, { method: 'POST', body: JSON.stringify(d) }); }
export function getListContasReceberQueryKey() { return ['contas-receber']; }

// ==================== DASHBOARD ====================
export function useGetDashboardStats() {
  return useQuery({ queryKey: ['dashboard'], queryFn: () => apiFetch<any>('/dashboard/stats').catch(() => ({ totalOrcamentos: 0, totalVendas: 0, totalOS: 0, totalClientes: 0 })) });
}
export function useGetOsPorStatus() { return useQuery({ queryKey: ['os-por-status'], queryFn: () => apiFetch<any[]>('/dashboard/os-por-status').catch(() => []) }); }
export function useGetVendasRecentes() { return useQuery({ queryKey: ['vendas-recentes'], queryFn: () => apiFetch<any[]>('/dashboard/vendas-recentes').catch(() => []) }); }
export function useGetOsAtrasadas() { return useQuery({ queryKey: ['os-atrasadas'], queryFn: () => apiFetch<any[]>('/dashboard/os-atrasadas').catch(() => []) }); }

// Fallback
export const apiClient = {};
