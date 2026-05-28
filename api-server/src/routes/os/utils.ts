import { db } from "../../lib/prisma";

type AnyRecord = Record<string, any>;

export function formatTimestamp(value: any): any {
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function serializeOS(r: AnyRecord, cliente?: AnyRecord) {
  return {
    id: r.id,
    numero: r.numero,
    vendaId: r.vendaId,
    clienteId: r.clienteId,
    dataInicio: r.dataInicio,
    dataTermino: r.dataTermino,
    prioridade: r.prioridade,
    status: r.status,
    etapaAtual: r.etapaAtual,
    observacoesGerais: r.observacoesGerais,
    observacoesCortedobra: r.observacoesCortedobra,
    observacoesSolda: r.observacoesSolda,
    arquivoProjeto: r.arquivoProjeto,
    createdAt: formatTimestamp(r.createdAt),
    cliente: cliente
      ? {
          id: cliente.id,
          razaoSocial: cliente.razaoSocial,
          nomeFantasia: cliente.nomeFantasia,
          cnpjCpf: cliente.cnpjCpf,
          cidade: cliente.cidade,
          estado: cliente.estado,
          telefone: cliente.telefone,
          email: cliente.email,
          observacoes: cliente.observacoes,
          createdAt: formatTimestamp(cliente.createdAt),
        }
      : undefined,
  };
}

export async function loadVendaItens(vendaId?: number) {
  if (!vendaId) return [];
  return db.vendaItem.findMany({
    where: { vendaId },
    include: { produto: true },
  });
}
