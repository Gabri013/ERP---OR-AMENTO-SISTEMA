import { db } from "../../lib/prisma";

type AnyRecord = Record<string, any>;

export async function getNextVendaNum(): Promise<string> {
  const count = await db.venda.count();
  return `VND-${(count + 1).toString().padStart(4, "0")}`;
}

export async function getNextOSNum(): Promise<string> {
  const count = await db.ordemServico.count();
  return `OS-${(count + 1).toString().padStart(4, "0")}`;
}

export function serializeVenda(r: AnyRecord, cliente?: AnyRecord) {
  return {
    id: r.id,
    numero: r.numero,
    orcamentoId: r.orcamentoId,
    clienteId: r.clienteId,
    usuarioId: r.usuarioId,
    dataVenda: r.dataVenda,
    valorTotal: Number(r.valorTotal),
    desconto: Number(r.desconto),
    formaPagamento: r.formaPagamento,
    numParcelas: r.numParcelas,
    status: r.status,
    observacoes: r.observacoes,
    observacoesVenda: r.observacoesVenda,
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
            cliente.createdAt instanceof Date ? cliente.createdAt.toISOString() : cliente.createdAt,
        }
      : undefined,
  };
}
