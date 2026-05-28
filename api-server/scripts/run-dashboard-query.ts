import { db } from "../src/lib/prisma";

async function run() {
  try {
    console.log('1) ordemServico.count...');
    const osEmAndamento = await db.ordemServico.count({ where: { status: { in: ["pendente", "liberada", "em_producao", "pausado", "em_revisao"] } } });
    console.log('osEmAndamento', osEmAndamento);

    console.log('2) apontamentoProducao.count today...');
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0,0,0,0);
    const producaoDia = await db.apontamentoProducao.count({ where: { createdAt: { gte: startOfDay } } });
    console.log('producaoDia', producaoDia);

    console.log('3) material.findMany...');
    const materiais = await db.material.findMany({ take: 5 });
    console.log('materiais', materiais.length);

    console.log('4) setor.findMany...');
    const setores = await db.setor.findMany({ include: { capacidades: { orderBy: { data: 'desc' }, take: 1 } } });
    console.log('setores', setores.length);

    console.log('5) apontamentoProducao.findMany include usuario setor...');
    const apontamentos = await db.apontamentoProducao.findMany({ where: { createdAt: { gte: startOfDay } }, include: { usuario: true, setor: true }, take: 10 });
    console.log('apontamentos', apontamentos.length);

    console.log('6) venda.aggregate...');
    const faturamento = await db.venda.aggregate({ _sum: { valorTotal: true } });
    console.log('faturamento', faturamento);

    console.log('7) ordemServico.findMany include relations...');
    const ordens = await db.ordemServico.findMany({ include: { cliente: true, etapas: true, apontamentos: true, etiquetas: true, inspecoesQualidade: true, venda: { include: { itens: { include: { produto: true } } } } }, orderBy: [{ prioridade: 'desc' }, { dataTermino: 'asc' }], take: 10 });
    console.log('ordens', ordens.length);

    console.log('8) venda.findMany...');
    const vendas = await db.venda.findMany({ orderBy: { dataVenda: 'asc' }, take: 50 });
    console.log('vendas', vendas.length);

    console.log('All queries executed successfully');
  } catch (e) {
    console.error('Query error:', e);
  } finally {
    await db.$disconnect();
  }
}

run();
