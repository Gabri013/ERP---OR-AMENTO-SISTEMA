// api-server/src/schemas.ts
// Minimal Zod schemas to replace the missing @workspace/api-zod package.
// These allow the routes to run. You can improve the validation later.

import { z } from "zod";

// ==================== AUTH ====================
export const LoginBody = z.object({
  email: z
    .any()
    .transform((val) => String(val))
    .pipe(z.string().email()),
  senha: z
    .any()
    .transform((val) => String(val))
    .pipe(z.string().min(6)),
});

export const LoginResponse = z.object({
  token: z.string(),
  user: z.any(),
});

// ==================== CLIENTES ====================
export const ListClientesQueryParams = z.object({
  q: z.string().optional(),
});

export const CreateClienteBody = z.object({
  razaoSocial: z.string().min(1),
  nomeFantasia: z.string().optional(),
  cnpjCpf: z.string().min(1).optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  observacoes: z.string().optional(),
});

export const UpdateClienteBody = CreateClienteBody.partial();

export const GetClienteParams = z.object({ id: z.string() });
export const UpdateClienteParams = z.object({ id: z.string() });
export const DeleteClienteParams = z.object({ id: z.string() });

// ==================== PRODUTOS ====================
export const CreateProdutoBody = z.object({
  codigo: z.string().optional(),
  nome: z.string(),
  descricao: z.string().optional(),
  valor: z.number().or(z.string()).transform(Number),
  estoque: z.number().optional(),
  status: z.string().optional(),
});

export const UpdateProdutoBody = CreateProdutoBody.partial();

export const ListProdutosQueryParams = z.object({ q: z.string().optional() });
export const GetProdutoParams = z.object({ id: z.string() });
export const UpdateProdutoParams = z.object({ id: z.string() });
export const DeleteProdutoParams = z.object({ id: z.string() });

// ==================== ORÇAMENTOS ====================
export const CreateOrcamentoBody = z.object({
  clienteId: z.number().or(z.string()).transform(Number),
  dataOrcamento: z.string().or(z.date()),
  validade: z.string().optional(),
  valorTotal: z.number().or(z.string()).transform(Number),
  desconto: z.number().optional(),
  observacoes: z.string().optional(),
  itens: z.array(z.any()).optional(),
});

export const UpdateOrcamentoBody = CreateOrcamentoBody.partial();

export const ListOrcamentosQueryParams = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});
export const GetOrcamentoParams = z.object({ id: z.string() });
export const UpdateOrcamentoParams = z.object({ id: z.string() });
export const DeleteOrcamentoParams = z.object({ id: z.string() });
export const ConverterOrcamentoParams = z.object({ id: z.string() });

// ==================== VENDAS ====================
export const CreateVendaBody = z.object({
  clienteId: z.number().or(z.string()).transform(Number),
  orcamentoId: z.number().optional(),
  dataVenda: z.string().or(z.date()),
  valorTotal: z.number().or(z.string()).transform(Number),
  formaPagamento: z.string().optional(),
  numParcelas: z.number().optional(),
  observacoes: z.string().optional(),
});

export const UpdateVendaBody = CreateVendaBody.partial();

export const ListVendasQueryParams = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});
export const GetVendaParams = z.object({ id: z.string() });
export const UpdateVendaParams = z.object({ id: z.string() });
export const GerarOsParaVendaParams = z.object({ id: z.string() });

// ==================== OS ====================
export const CreateOSBody = z.object({
  vendaId: z.number().or(z.string()).transform(Number),
  clienteId: z.number().or(z.string()).transform(Number),
  dataInicio: z.string().or(z.date()),
  prioridade: z.string().optional(),
  observacoesGerais: z.string().optional(),
});

export const UpdateOSBody = z.object({
  status: z.string().optional(),
  etapaAtual: z.string().optional(),
  observacoesGerais: z.string().optional(),
});

export const GetOSParams = z.object({ id: z.string() });
export const UpdateOSParams = z.object({ id: z.string() });
export const ListOSQueryParams = z.object({ q: z.string().optional() });
export const AvancarEtapaOSBody = z.object({
  etapa: z.string().optional(),
  novaEtapa: z.string().optional(),
  observacao: z.string().optional(),
});
export const AvancarEtapaOSParams = z.object({ id: z.string() });
export const AddObservacaoOSParams = z.object({ id: z.string() });
export const AddObservacaoOSBody = z.object({
  tipoSetor: z.string(),
  observacao: z.string(),
});

// ==================== FINANCEIRO ====================
export const CreateContaPagarBody = z.object({
  descricao: z.string(),
  fornecedor: z.string().optional(),
  valor: z.number().or(z.string()).transform(Number),
  dataVencimento: z.string().or(z.date()),
});

export const PagarContaBody = z.object({
  valorPago: z.number().or(z.string()).transform(Number),
  formaPagamento: z.string(),
  observacao: z.string().optional(),
});

export const ListContasReceberQueryParams = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});
export const ListContasPagarQueryParams = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});
export const PagarContaReceberParams = z.object({ id: z.string() });
export const PagarContaReceberBody = PagarContaBody;
export const PagarContaPagarParams = z.object({ id: z.string() });

// ==================== USUARIOS ====================
export const CreateUsuarioBody = z.object({
  nome: z.string(),
  email: z.string().email(),
  senha: z.string().min(6),
  tipo: z.string().optional(),
  telefoneWhatsapp: z.string().optional(),
});

export const UpdateUsuarioBody = CreateUsuarioBody.partial().omit({
  senha: true,
});

export const ListUsuariosQueryParams = z.object({ q: z.string().optional() });
export const UpdateUsuarioParams = z.object({ id: z.string() });
export const DeleteUsuarioParams = z.object({ id: z.string() });

// ==================== DASHBOARD ====================
export const HealthCheckResponse = z.object({
  status: z.string(),
  timestamp: z.string(),
});

export const DashboardStatsResponse = z.object({
  totalClientes: z.number(),
  totalOrcamentos: z.number(),
  totalVendas: z.number(),
  totalOS: z.number(),
  faturamentoMes: z.number().optional(),
});
