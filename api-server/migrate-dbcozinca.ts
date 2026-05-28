import {
  PrismaClient,
  type TipoUsuario,
  type StatusOrcamento,
  type StatusVenda,
  type StatusOS,
  type StatusConta,
  type Prioridade,
  type EtapaProducao,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sqlPath = resolve(__dirname, "../dbcozinca.sql");

type SqlValue = string | number | null;
type SqlRow = Record<string, SqlValue>;

const setorSeed = [
  { id: 1, nome: "Vendas", descricao: "Departamento de Vendas", tipo: "vendas" },
  { id: 2, nome: "Corte", descricao: "Setor de Corte - Primeira etapa de producao", tipo: "producao" },
  { id: 3, nome: "Dobra", descricao: "Setor de Dobra - Segunda etapa de producao", tipo: "producao" },
  { id: 4, nome: "Solda", descricao: "Setor de Solda - Terceira etapa de producao", tipo: "producao" },
  { id: 5, nome: "Montagem", descricao: "Setor de Montagem - Quarta etapa de producao", tipo: "producao" },
  { id: 6, nome: "Financeiro", descricao: "Departamento Financeiro", tipo: "financeiro" },
  { id: 7, nome: "Engenharia", descricao: "Departamento de Engenharia e Projetos", tipo: "producao" },
  { id: 8, nome: "Qualidade", descricao: "Setor de Qualidade e Controle", tipo: "producao" },
  { id: 9, nome: "Expedição", descricao: "Setor de Expedicao e Entrega", tipo: "producao" },
] as const;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asInt(value: SqlValue | undefined, fallback = 0): number {
  if (typeof value === "number") return Math.trunc(value);
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asFloat(value: SqlValue | undefined, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asOptionalText(value: SqlValue | undefined): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text.length > 0 ? text : null;
}

function asRequiredText(value: SqlValue | undefined, fallback = ""): string {
  const text = asOptionalText(value);
  return text ?? fallback;
}

function safeDate(value: SqlValue | undefined, fallback = new Date()): Date {
  if (value instanceof Date) return value;
  if (value === null || value === undefined) return fallback;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$/.test(value);
}

function mapTipoUsuario(value: SqlValue | undefined): TipoUsuario {
  const allowed = new Set<TipoUsuario>([
    "master",
    "gerente",
    "gestor_vendas",
    "vendedor",
    "financeiro",
    "engenharia",
    "producao",
    "corte",
    "dobra",
    "solda",
    "montagem",
    "visualizador",
    "projetista",
    "consultor",
    "dashboard_producao",
    "refrigeracao",
    "acabamento",
    "finalizacao",
  ]);
  const raw = asRequiredText(value, "vendedor") as TipoUsuario;
  return allowed.has(raw) ? raw : "vendedor";
}

function mapStatusOrcamento(value: SqlValue | undefined): StatusOrcamento {
  const raw = asRequiredText(value, "pendente");
  const map: Record<string, StatusOrcamento> = {
    pendente: "pendente",
    aprovado: "em_projeto",
    convertido: "convertido",
    cancelado: "cancelada",
    cancelada: "cancelada",
    em_projeto: "em_projeto",
    em_revisao: "em_revisao",
    em_producao: "em_producao",
    concluida: "concluida",
  };
  return map[raw] ?? "pendente";
}

function mapStatusVenda(value: SqlValue | undefined): StatusVenda {
  const raw = asRequiredText(value, "em_andamento");
  const map: Record<string, StatusVenda> = {
    em_andamento: "em_andamento",
    concluida: "concluida",
    cancelada: "cancelada",
    cancelado: "cancelada",
  };
  return map[raw] ?? "em_andamento";
}

function mapStatusOS(value: SqlValue | undefined): StatusOS {
  const raw = asRequiredText(value, "pendente");
  const map: Record<string, StatusOS> = {
    pendente: "pendente",
    liberada: "liberada",
    em_projeto: "em_projeto",
    em_revisao: "em_revisao",
    em_producao: "em_producao",
    pausado: "pausado",
    concluida: "concluida",
    entregue: "entregue",
    cancelada: "cancelada",
    cancelado: "cancelada",
  };
  return map[raw] ?? "pendente";
}

function mapStatusConta(value: SqlValue | undefined): StatusConta {
  const raw = asRequiredText(value, "PENDENTE").toUpperCase();
  const map: Record<string, StatusConta> = {
    PENDENTE: "PENDENTE",
    PAGO: "PAGO",
    ATRASADO: "ATRASADO",
    CANCELADO: "CANCELADO",
    PARCIALMENTE_PAGO: "PARCIALMENTE_PAGO",
    RENEGOCIADO: "RENEGOCIADO",
  };
  return map[raw] ?? "PENDENTE";
}

function mapPrioridade(value: SqlValue | undefined): Prioridade {
  const raw = asRequiredText(value, "verde");
  const map: Record<string, Prioridade> = {
    verde: "verde",
    amarelo: "amarelo",
    vermelho: "vermelho",
  };
  return map[raw] ?? "verde";
}

function mapEtapaProducao(value: SqlValue | undefined): EtapaProducao {
  const raw = asRequiredText(value, "autorizacao");
  const map: Record<string, EtapaProducao> = {
    programacao: "programacao",
    engenharia: "engenharia",
    corte: "corte",
    dobra: "dobra",
    tubo: "tubo",
    solda: "solda",
    coccao: "coccao",
    refrigeracao: "refrigeracao",
    mobiliario: "mobiliario",
    montagem: "montagem",
    revisao: "revisao",
    embalagem: "embalagem",
    expedicao: "expedicao",
    autorizacao: "autorizacao",
    acabamento: "acabamento",
    finalizacao: "finalizacao",
    concluida: "concluida",
    entregue: "entregue",
  };
  return map[raw] ?? "autorizacao";
}

function mapNotificationType(value: SqlValue | undefined): string {
  const raw = asRequiredText(value, "info").toLowerCase();
  const map: Record<string, string> = {
    info: "info",
    warning: "warning",
    success: "success",
    error: "error",
  };
  return map[raw] ?? "info";
}

function rowToData(columns: string[], values: SqlValue[]): SqlRow {
  const row: SqlRow = {};
  for (let i = 0; i < columns.length; i += 1) {
    row[columns[i]] = values[i] ?? null;
  }
  return row;
}

function splitColumns(rawColumns: string): string[] {
  return rawColumns
    .split(",")
    .map((column) => column.trim().replace(/`/g, ""));
}

function parseValueLiteral(raw: string): SqlValue {
  const value = raw.trim();
  if (value.length === 0 || value.toUpperCase() === "NULL") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return value.includes(".") ? Number.parseFloat(value) : Number.parseInt(value, 10);
  }
  return value;
}

function splitTupleValues(tuple: string): SqlValue[] {
  const values: SqlValue[] = [];
  let current = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < tuple.length; i += 1) {
    const ch = tuple[i];
    const next = tuple[i + 1];

    if (inString) {
      if (escaped) {
        current += ch;
        escaped = false;
        continue;
      }

      if (ch === "\\") {
        current += ch;
        escaped = true;
        continue;
      }

      if (ch === "'" && next === "'") {
        current += "'";
        i += 1;
        continue;
      }

      if (ch === "'") {
        inString = false;
        continue;
      }

      current += ch;
      continue;
    }

    if (ch === "'") {
      inString = true;
      continue;
    }

    if (ch === ",") {
      values.push(parseValueLiteral(current));
      current = "";
      continue;
    }

    current += ch;
  }

  values.push(parseValueLiteral(current));
  return values;
}

function extractTupleBodies(valuesPart: string): string[] {
  const tuples: string[] = [];
  let current = "";
  let inString = false;
  let escaped = false;
  let depth = 0;

  for (let i = 0; i < valuesPart.length; i += 1) {
    const ch = valuesPart[i];
    const next = valuesPart[i + 1];

    if (inString) {
      current += ch;
      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === "\\") {
        escaped = true;
        continue;
      }

      if (ch === "'" && next === "'") {
        current += "'";
        i += 1;
        continue;
      }

      if (ch === "'") {
        inString = false;
      }
      continue;
    }

    if (ch === "'") {
      inString = true;
      current += ch;
      continue;
    }

    if (ch === "(") {
      if (depth === 0) current = "";
      depth += 1;
      continue;
    }

    if (ch === ")" && depth > 0) {
      depth -= 1;
      if (depth === 0) {
        tuples.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
      continue;
    }

    if (depth > 0) {
      current += ch;
    }
  }

  return tuples;
}

function findStatementEnd(sql: string, startIndex: number): number {
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === "\\") {
        escaped = true;
        continue;
      }

      if (ch === "'" && next === "'") {
        i += 1;
        continue;
      }

      if (ch === "'") {
        inString = false;
      }
      continue;
    }

    if (ch === "'") {
      inString = true;
      continue;
    }

    if (ch === ";") return i;
  }

  return sql.length;
}

function parseInsertStatements(sql: string): Array<{
  table: string;
  columns: string[];
  rows: SqlRow[];
}> {
  const statements: Array<{
    table: string;
    columns: string[];
    rows: SqlRow[];
  }> = [];

  const startRegex = /INSERT INTO\s+`([^`]+)`\s*\(([^)]+)\)\s*VALUES\s*/gi;
  let match: RegExpExecArray | null;

  while ((match = startRegex.exec(sql)) !== null) {
    const table = match[1];
    const columns = splitColumns(match[2]);
    const valuesStart = startRegex.lastIndex;
    const valuesEnd = findStatementEnd(sql, valuesStart);
    const valuesPart = sql.slice(valuesStart, valuesEnd).trim();
    const tuples = extractTupleBodies(valuesPart);
    const rows = tuples.map((tuple) => rowToData(columns, splitTupleValues(tuple)));

    statements.push({ table, columns, rows });
    startRegex.lastIndex = valuesEnd + 1;
  }

  return statements;
}

async function ensureLegacyArchiveTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "LegacyDbcozincaRecord" (
      "id" SERIAL PRIMARY KEY,
      "sourceTable" TEXT NOT NULL,
      "sourceId" INTEGER,
      "data" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "LegacyDbcozincaRecord_sourceTable_idx"
    ON "LegacyDbcozincaRecord" ("sourceTable")
  `);
}

async function resetLegacyArchive(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "LegacyDbcozincaRecord" RESTART IDENTITY`,
  );
}

async function resetCoreTables(): Promise<void> {
  console.log("Limpando tabelas atuais...");
  await prisma.oSAnexo.deleteMany({});
  await prisma.oSChecklist.deleteMany({});
  await prisma.oSEtapaProducao.deleteMany({});
  await prisma.oSHistoricoStatus.deleteMany({});
  await prisma.oSObservacao.deleteMany({});
  await prisma.pagamento.deleteMany({});
  await prisma.contaReceber.deleteMany({});
  await prisma.contaPagar.deleteMany({});
  await prisma.vendaItem.deleteMany({});
  await prisma.venda.deleteMany({});
  await prisma.orcamentoItem.deleteMany({});
  await prisma.orcamentoSetor.deleteMany({});
  await prisma.ordemServico.deleteMany({});
  await prisma.orcamento.deleteMany({});
  await prisma.notificacao.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.rolePermissao.deleteMany({});
  await prisma.permissao.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.produto.deleteMany({});
  await prisma.usuario.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.setor.deleteMany({});
}

async function seedSetores(): Promise<void> {
  console.log("Seed de setores base...");
  for (const setor of setorSeed) {
    await prisma.setor.create({
      data: {
        id: setor.id,
        nome: setor.nome,
        descricao: setor.descricao,
        tipo: setor.tipo,
      },
    });
  }
}

async function migrateClientes(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const cliente of rows) {
    await prisma.cliente.create({
      data: {
        id: asInt(cliente.id),
        razaoSocial: asRequiredText(cliente.razao_social),
        nomeFantasia: asOptionalText(cliente.nome_fantasia),
        cnpjCpf: asOptionalText(cliente.cnpj_cpf),
        endereco: asOptionalText(cliente.endereco),
        cidade: asOptionalText(cliente.cidade),
        estado: asOptionalText(cliente.estado),
        telefone: asOptionalText(cliente.telefone),
        email: asOptionalText(cliente.email),
        observacoes: asOptionalText(cliente.observacoes),
        createdAt: safeDate(cliente.created_at),
        updatedAt: safeDate(cliente.updated_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateUsuarios(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const usuario of rows) {
    const senha = asRequiredText(usuario.senha, "123456");
    const hash = isBcryptHash(senha) ? senha : await bcrypt.hash(senha, 10);

    await prisma.usuario.create({
      data: {
        id: asInt(usuario.id),
        nome: asRequiredText(usuario.nome),
        email: asRequiredText(usuario.email),
        senha: hash,
        tipo: mapTipoUsuario(usuario.tipo),
        status: asRequiredText(usuario.status, "ativo"),
        telefoneWhatsapp: asOptionalText(usuario.telefone_whatsapp),
        createdAt: safeDate(usuario.created_at),
        updatedAt: safeDate(usuario.updated_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateProdutos(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const produto of rows) {
    await prisma.produto.create({
      data: {
        id: asInt(produto.id),
        codigo: asOptionalText(produto.codigo),
        nome: asRequiredText(produto.nome),
        descricao: asOptionalText(produto.descricao),
        valor: asFloat(produto.valor),
        estoque: asInt(produto.estoque),
        status: asRequiredText(produto.status, "ativo"),
        tipoProduto: "padrao",
        createdAt: safeDate(produto.created_at),
        updatedAt: safeDate(produto.updated_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateOrcamentos(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const orcamento of rows) {
    await prisma.orcamento.create({
      data: {
        id: asInt(orcamento.id),
        numero: asRequiredText(orcamento.numero),
        clienteId: asInt(orcamento.cliente_id),
        usuarioId: asInt(orcamento.usuario_id),
        dataOrcamento: safeDate(orcamento.data_orcamento),
        validade: orcamento.validade ? safeDate(orcamento.validade) : null,
        valorTotal: asFloat(orcamento.valor_total),
        desconto: asFloat(orcamento.desconto),
        status: mapStatusOrcamento(orcamento.status),
        observacoes: asOptionalText(orcamento.observacoes),
        createdAt: safeDate(orcamento.created_at),
        updatedAt: safeDate(orcamento.updated_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateOrcamentoItens(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const item of rows) {
    await prisma.orcamentoItem.create({
      data: {
        id: asInt(item.id),
        orcamentoId: asInt(item.orcamento_id),
        produtoId: item.produto_id === null ? null : asInt(item.produto_id),
        descricaoManual: asOptionalText(item.descricao_manual),
        quantidade: asFloat(item.quantidade, 1),
        valorUnitario: asFloat(item.valor_unitario),
        valorTotal: asFloat(item.valor_total),
        createdAt: safeDate(item.created_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateVendas(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const venda of rows) {
    await prisma.venda.create({
      data: {
        id: asInt(venda.id),
        numero: asRequiredText(venda.numero),
        orcamentoId: venda.orcamento_id === null ? null : asInt(venda.orcamento_id),
        clienteId: asInt(venda.cliente_id),
        usuarioId: asInt(venda.usuario_id),
        dataVenda: safeDate(venda.data_venda),
        valorTotal: asFloat(venda.valor_total),
        desconto: asFloat(venda.desconto),
        formaPagamento: asOptionalText(venda.forma_pagamento),
        numParcelas: asInt(venda.num_parcelas, 1),
        status: mapStatusVenda(venda.status),
        observacoes: asOptionalText(venda.observacoes),
        observacoesVenda: asOptionalText(venda.observacoes_venda),
        createdAt: safeDate(venda.created_at),
        updatedAt: safeDate(venda.updated_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateVendaItens(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const item of rows) {
    await prisma.vendaItem.create({
      data: {
        id: asInt(item.id),
        vendaId: asInt(item.venda_id),
        produtoId: item.produto_id === null ? null : asInt(item.produto_id),
        descricaoManual: asOptionalText(item.descricao_manual),
        quantidade: asFloat(item.quantidade, 1),
        valorUnitario: asFloat(item.valor_unitario),
        valorTotal: asFloat(item.valor_total),
        createdAt: safeDate(item.created_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateOrdensServico(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const os of rows) {
    await prisma.ordemServico.create({
      data: {
        id: asInt(os.id),
        numero: asRequiredText(os.numero),
        vendaId: os.venda_id === null ? null : asInt(os.venda_id),
        clienteId: asInt(os.cliente_id),
        dataInicio: safeDate(os.data_inicio),
        dataTermino: os.data_termino ? safeDate(os.data_termino) : null,
        prioridade: mapPrioridade(os.prioridade),
        status: mapStatusOS(os.status),
        etapaAtual: mapEtapaProducao(os.etapa_atual),
        observacoesGerais: asOptionalText(os.observacoes_gerais),
        observacoesCortedobra: asOptionalText(os.observacoes_corte_dobra),
        observacoesSolda: asOptionalText(os.observacoes_solda),
        arquivoProjeto: asOptionalText(os.arquivo_projeto),
        createdAt: safeDate(os.created_at),
        updatedAt: safeDate(os.updated_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateOsHistoricoStatus(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const item of rows) {
    await prisma.oSHistoricoStatus.create({
      data: {
        id: asInt(item.id),
        osId: asInt(item.os_id),
        statusAnterior: asOptionalText(item.status_anterior),
        statusNovo: asRequiredText(item.status_novo),
        observacao: asOptionalText(item.observacao),
        usuarioId: item.usuario_id === null ? null : asInt(item.usuario_id),
        createdAt: safeDate(item.created_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateOsObservacoes(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const item of rows) {
    await prisma.oSObservacao.create({
      data: {
        id: asInt(item.id),
        osId: asInt(item.os_id),
        tipoSetor: asRequiredText(item.tipo_setor),
        observacao: asRequiredText(item.observacao),
        usuarioId: item.usuario_id === null ? null : asInt(item.usuario_id),
        createdAt: safeDate(item.created_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateOsEtapas(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const item of rows) {
    await prisma.oSEtapaProducao.create({
      data: {
        id: asInt(item.id),
        osId: asInt(item.os_id),
        etapa: mapEtapaProducao(item.etapa),
        status: asRequiredText(item.status, "pendente"),
        responsavel: asOptionalText(item.responsavel),
        lider: asOptionalText(item.lider),
        tempoEstimado: item.tempo_estimado === null ? null : asInt(item.tempo_estimado),
        tempoReal: item.tempo_real === null ? null : asInt(item.tempo_real),
        observacao: asOptionalText(item.observacao),
        dataInicio: item.data_inicio ? safeDate(item.data_inicio) : null,
        dataFim: item.data_fim ? safeDate(item.data_fim) : null,
        usuarioId: item.usuario_id === null ? null : asInt(item.usuario_id),
        createdAt: safeDate(item.created_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateContasReceber(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const cr of rows) {
    await prisma.contaReceber.create({
      data: {
        id: asInt(cr.id),
        vendaId: asInt(cr.venda_id),
        clienteId: asInt(cr.cliente_id),
        parcelaNumero: asInt(cr.parcela_numero, 1),
        totalParcelas: asInt(cr.total_parcelas, 1),
        valorBruto: asFloat(cr.valor_bruto),
        valorLiquido: asFloat(cr.valor_liquido),
        valorRecebido: asFloat(cr.valor_recebido),
        dataVencimento: safeDate(cr.data_vencimento),
        dataPagamento: cr.data_pagamento ? safeDate(cr.data_pagamento) : null,
        formaPagamento: asOptionalText(cr.forma_pagamento),
        status: mapStatusConta(cr.status),
        createdAt: safeDate(cr.created_at),
        updatedAt: safeDate(cr.updated_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateContasPagar(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const cp of rows) {
    await prisma.contaPagar.create({
      data: {
        id: asInt(cp.id),
        descricao: asRequiredText(cp.descricao),
        fornecedor: asOptionalText(cp.fornecedor),
        valor: asFloat(cp.valor),
        dataVencimento: safeDate(cp.data_vencimento),
        dataPagamento: cp.data_pagamento ? safeDate(cp.data_pagamento) : null,
        status: mapStatusConta(cp.status),
        createdAt: safeDate(cp.created_at),
        updatedAt: safeDate(cp.updated_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migratePagamentos(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const pg of rows) {
    await prisma.pagamento.create({
      data: {
        id: asInt(pg.id),
        contaReceberId: asInt(pg.conta_receber_id),
        usuarioId: asInt(pg.usuario_id),
        valorPago: asFloat(pg.valor_pago),
        formaPagamento: asRequiredText(pg.forma_pagamento, "avista"),
        observacao: asOptionalText(pg.observacao),
        createdAt: safeDate(pg.created_at),
      },
    });
    count += 1;
  }
  return count;
}

async function migrateNotificacoes(rows: SqlRow[]): Promise<number> {
  let count = 0;
  for (const item of rows) {
    await prisma.notificacao.create({
      data: {
        id: asInt(item.id),
        usuarioId: asInt(item.usuario_id),
        titulo: asRequiredText(item.titulo),
        mensagem: asRequiredText(item.mensagem),
        tipo: mapNotificationType(item.tipo),
        lida: String(item.lida ?? "0") === "1",
        link: asOptionalText(item.referencia_tipo)
          ? `${asOptionalText(item.referencia_tipo)}/${asOptionalText(item.referencia_id) ?? ""}`
          : null,
        createdAt: safeDate(item.created_at),
      },
    });
    count += 1;
  }
  return count;
}

async function archiveAllStatements(statements: Array<{ table: string; rows: SqlRow[] }>): Promise<number> {
  const batchSize = 500;
  const batch: Array<{ sourceTable: string; sourceId: number | null; data: SqlRow }> = [];
  let total = 0;

  async function flushBatch(): Promise<void> {
    if (batch.length === 0) return;

    const valuesSql: string[] = [];
    const params: unknown[] = [];

    for (const item of batch) {
      params.push(item.sourceTable, item.sourceId, JSON.stringify(item.data));
      const offset = params.length - 2;
      valuesSql.push(`($${offset}, $${offset + 1}, $${offset + 2}::jsonb)`);
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO "LegacyDbcozincaRecord" ("sourceTable", "sourceId", "data") VALUES ${valuesSql.join(",")}`,
      ...params,
    );

    total += batch.length;
    batch.length = 0;
    console.log(`  Arquivados: ${total}`);
  }

  for (const statement of statements) {
    for (const row of statement.rows) {
      const sourceIdValue = row.id;
      const sourceId = isFiniteNumber(sourceIdValue) ? sourceIdValue : null;
      batch.push({ sourceTable: statement.table, sourceId, data: row });

      if (batch.length >= batchSize) {
        await flushBatch();
      }
    }
  }

  await flushBatch();
  return total;
}

async function setSequence(table: string, column: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', '${column}'), COALESCE((SELECT MAX("${column}") FROM "${table}"), 1), true)`,
  );
}

async function main(): Promise<void> {
  console.log("Iniciando migracao completa de dbcozinca.sql...");
  const sql = readFileSync(sqlPath, "utf-8");
  const statements = parseInsertStatements(sql);
  const grouped = new Map<string, SqlRow[]>();

  for (const statement of statements) {
    grouped.set(statement.table, [...(grouped.get(statement.table) ?? []), ...statement.rows]);
  }

  await ensureLegacyArchiveTable();
  await resetLegacyArchive();
  await resetCoreTables();
  await seedSetores();

  console.log("Arquivando todos os registros antigos...");
  const archiveCount = await archiveAllStatements(statements);

  console.log("Migrando tabelas principais para o schema atual...");
  const summary: Array<[string, number, number]> = [];

  const coreMigrations: Array<[string, () => Promise<number>]> = [
    ["clientes", () => migrateClientes(grouped.get("clientes") ?? [])],
    ["usuarios", () => migrateUsuarios(grouped.get("usuarios") ?? [])],
    ["produtos", () => migrateProdutos(grouped.get("produtos") ?? [])],
    ["orcamentos", () => migrateOrcamentos(grouped.get("orcamentos") ?? [])],
    ["orcamentos_itens", () => migrateOrcamentoItens(grouped.get("orcamentos_itens") ?? [])],
    ["vendas", () => migrateVendas(grouped.get("vendas") ?? [])],
    ["vendas_itens", () => migrateVendaItens(grouped.get("vendas_itens") ?? [])],
    ["ordens_servico", () => migrateOrdensServico(grouped.get("ordens_servico") ?? [])],
    ["os_historico_status", () => migrateOsHistoricoStatus(grouped.get("os_historico_status") ?? [])],
    ["os_observacoes", () => migrateOsObservacoes(grouped.get("os_observacoes") ?? [])],
    ["os_etapas_producao", () => migrateOsEtapas(grouped.get("os_etapas_producao") ?? [])],
    ["contas_receber", () => migrateContasReceber(grouped.get("contas_receber") ?? [])],
    ["contas_pagar", () => migrateContasPagar(grouped.get("contas_pagar") ?? [])],
    ["pagamentos", () => migratePagamentos(grouped.get("pagamentos") ?? [])],
    ["notificacoes", () => migrateNotificacoes(grouped.get("notificacoes") ?? [])],
  ];

  for (const [table, migrate] of coreMigrations) {
    const sourceCount = grouped.get(table)?.length ?? 0;
    const imported = await migrate();
    summary.push([table, sourceCount, imported]);
    console.log(`  ${table}: ${imported}/${sourceCount}`);
  }

  await setSequence("Setor", "id");
  await setSequence("Cliente", "id");
  await setSequence("Usuario", "id");
  await setSequence("Produto", "id");
  await setSequence("Orcamento", "id");
  await setSequence("OrcamentoItem", "id");
  await setSequence("Venda", "id");
  await setSequence("VendaItem", "id");
  await setSequence("OrdemServico", "id");
  await setSequence("OSHistoricoStatus", "id");
  await setSequence("OSObservacao", "id");
  await setSequence("OSEtapaProducao", "id");
  await setSequence("ContaReceber", "id");
  await setSequence("ContaPagar", "id");
  await setSequence("Pagamento", "id");
  await setSequence("Notificacao", "id");

  console.log("");
  console.log("Resumo da migracao:");
  for (const [table, source, imported] of summary) {
    console.log(`  ${table}: ${imported}/${source}`);
  }

  const legacyCount = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM "LegacyDbcozincaRecord"`,
  ) as Array<{ count: number }>;

  console.log("");
  console.log(`Registros arquivados no legado: ${legacyCount[0]?.count ?? 0}`);
  console.log(`Registros totais no dump: ${statements.reduce((acc, statement) => acc + statement.rows.length, 0)}`);
  console.log("Migracao completa finalizada com sucesso.");
  console.log(`\nDEBUG archive count: ${archiveCount}`);
}

main()
  .catch((error) => {
    console.error("Falha na migracao:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
