import { db } from "../src/lib/prisma";

async function main() {
  const [vendaNull] = await db.$queryRawUnsafe(`SELECT count(*)::int as c FROM "Venda" WHERE "dataVenda" IS NULL`);
  console.log('vendas with null dataVenda:', vendaNull.c);

  const [ordemNull] = await db.$queryRawUnsafe(`SELECT count(*)::int as c FROM "OrdemServico" WHERE "dataTermino" IS NULL`);
  console.log('ordens with null dataTermino:', ordemNull.c);

  const sampleVendas: any[] = await db.$queryRawUnsafe(`SELECT id, numero, ("dataVenda" IS NOT NULL) as has_date FROM "Venda" ORDER BY id DESC LIMIT 10`);
  console.log('sample vendas (has_date):', sampleVendas.map((v:any)=>({id:v.id, numero:v.numero, hasDate: v.has_date})));

  await db.$disconnect();
}

main().catch(e=>{ console.error(e); process.exit(1); });
