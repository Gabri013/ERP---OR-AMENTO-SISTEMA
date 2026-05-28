import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clear() {
  await prisma.pagamento.deleteMany({});
  await prisma.contaReceber.deleteMany({});
  await prisma.vendaItem.deleteMany({});
  await prisma.venda.deleteMany({});
  await prisma.ordemServico.deleteMany({});
  await prisma.orcamentoItem.deleteMany({});
  await prisma.orcamento.deleteMany({});
  await prisma.produto.deleteMany({});
  await prisma.usuario.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.contaPagar.deleteMany({});
  console.log('Data cleared');
  await prisma.$disconnect();
}

clear();