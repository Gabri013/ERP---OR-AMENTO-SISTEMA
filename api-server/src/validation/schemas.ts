import { z } from 'zod';

// ============================================================================
// PADRÕES DE VALIDAÇÃO REUTILIZÁVEIS
// ============================================================================

export const emailSchema = z.string()
  .email('Email inválido')
  .toLowerCase();

export const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (use formato: 000.000.000-00)')
  .optional();

export const cnpjSchema = z.string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido (use formato: 00.000.000/0000-00)')
  .optional();

export const telefoneSchema = z.string()
  .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido (use formato: (00) 99999-9999)')
  .optional();

export const dataFuturaSchema = z.coerce.date()
  .refine(date => date > new Date(), 'Data deve ser futura');

export const dataSchema = z.coerce.date();

export const valorPositivoSchema = z.number()
  .positive('Valor deve ser positivo')
  .finite('Valor deve ser um número válido');

// ============================================================================
// SCHEMAS DE ENTIDADES DE NEGÓCIO
// ============================================================================

/**
 * Validação para criação/atualização de clientes
 */
export const ClienteSchema = z.object({
  razaoSocial: z.string()
    .min(3, 'Razão social deve ter pelo menos 3 caracteres')
    .max(150, 'Razão social muito longa'),
  nomeFantasia: z.string().max(150, 'Nome fantasia muito longo').optional(),
  cnpjCpf: cnpjSchema.or(cpfSchema).optional(),
  email: emailSchema.optional(),
  telefone: telefoneSchema,
  endereco: z.string().max(250, 'Endereço muito longo').optional(),
  cidade: z.string().max(100, 'Cidade muito longa').optional(),
  estado: z.string()
    .length(2, 'Estado deve ter 2 caracteres (ex: SP)')
    .toUpperCase()
    .optional(),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
});

/**
 * Validação para itens de orçamento
 */
export const OrcamentoItemSchema = z.object({
  produtoId: z.number().int().positive('ID do produto inválido').optional(),
  descricaoManual: z.string().max(500, 'Descrição muito longa').optional(),
  quantidade: z.number()
    .positive('Quantidade deve ser maior que 0'),
  valorUnitario: valorPositivoSchema,
  valorTotal: valorPositivoSchema,
});

/**
 * Validação para criação/atualização de orçamentos
 */
export const OrcamentoSchema = z.object({
  clienteId: z.number().int().positive('Cliente obrigatório'),
  dataOrcamento: dataSchema,
  validade: dataFuturaSchema.optional(),
  itens: z.array(OrcamentoItemSchema)
    .min(1, 'Mínimo 1 item no orçamento'),
  desconto: z.number()
    .min(0, 'Desconto não pode ser negativo')
    .max(100, 'Desconto não pode ser maior que 100%')
    .optional()
    .default(0),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
});

/**
 * Validação para criação de vendas
 */
export const VendaSchema = z.object({
  orcamentoId: z.number().int().positive('Orçamento obrigatório'),
  statusPagamento: z.enum(['pendente', 'parcial', 'pago']).optional(),
  dataVenda: dataSchema,
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
});

/**
 * Validação para contas a receber
 */
export const ContaReceberSchema = z.object({
  vendaId: z.number().int().positive('Venda obrigatória'),
  parcelaNumero: z.number()
    .int('Número da parcela deve ser inteiro')
    .positive('Número da parcela inválido'),
  totalParcelas: z.number()
    .int('Total de parcelas deve ser inteiro')
    .positive('Total de parcelas inválido'),
  dataVencimento: dataFuturaSchema,
  formaPagamento: z.enum(['dinheiro', 'cartao', 'boleto', 'transferencia']).optional(),
  observacoes: z.string().max(500, 'Observações muito longas').optional(),
});

/**
 * Validação para contas a pagar
 */
export const ContaPagarSchema = z.object({
  descricao: z.string()
    .min(3, 'Descrição obrigatória')
    .max(500, 'Descrição muito longa'),
  fornecedor: z.string().max(150, 'Fornecedor muito longo').optional(),
  valor: valorPositivoSchema,
  dataVencimento: dataSchema,
  formaPagamento: z.enum(['dinheiro', 'cartao', 'boleto', 'transferencia']).optional(),
  status: z.enum(['pendente', 'pago', 'cancelada']).optional(),
});

/**
 * Validação para ordens de serviço
 */
export const OrdemServicoSchema = z.object({
  vendaId: z.number().int().positive('Venda obrigatória'),
  dataInicio: dataSchema.optional(),
  statusProducao: z.string().max(100).optional(),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
});

/**
 * Validação para usuários
 */
export const UsuarioSchema = z.object({
  nome: z.string()
    .min(3, 'Nome obrigatório')
    .max(100, 'Nome muito longo'),
  email: emailSchema,
  telefone: telefoneSchema,
  tipo: z.enum(['admin', 'gerente', 'vendedor', 'producao', 'consultor']),
});

/**
 * Validação para alteração de senha
 */
export const ChangePasswordSchema = z.object({
  senhaAtual: z.string().min(6, 'Senha atual obrigatória'),
  senhaNova: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .refine(
      (pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd),
      'Senha deve conter maiúscula, minúscula e número'
    ),
  senhaConfirm: z.string(),
}).refine((data) => data.senhaNova === data.senhaConfirm, {
  message: "Senhas não coincidem",
  path: ["senhaConfirm"],
});

// ============================================================================
// EXPORT CONSOLIDADO
// ============================================================================

export const schemas = {
  ClienteSchema,
  OrcamentoSchema,
  OrcamentoItemSchema,
  VendaSchema,
  ContaReceberSchema,
  ContaPagarSchema,
  OrdemServicoSchema,
  UsuarioSchema,
  ChangePasswordSchema,
};

export default schemas;
