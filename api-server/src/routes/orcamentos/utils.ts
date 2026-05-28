import { db } from "../../lib/prisma";

type AnyRecord = Record<string, any>;

export async function getNextOrcamentoNum(): Promise<string> {
  const count = await db.orcamento.count();
  return `ORC-${(count + 1).toString().padStart(4, "0")}`;
}

export async function getNextVendaNum(): Promise<string> {
  const count = await db.venda.count();
  return `VND-${(count + 1).toString().padStart(4, "0")}`;
}

export function serializeOrc(r: AnyRecord, cliente?: AnyRecord) {
  return {
    id: r.id,
    numero: r.numero,
    clienteId: r.clienteId,
    usuarioId: r.usuarioId,
    dataOrcamento: r.dataOrcamento,
    validade: r.validade,
    valorTotal: Number(r.valorTotal),
    desconto: Number(r.desconto),
    status: r.status,
    observacoes: r.observacoes,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
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
          createdAt:
            cliente.createdAt instanceof Date
              ? cliente.createdAt.toISOString()
              : cliente.createdAt,
        }
      : undefined,
  };
}
