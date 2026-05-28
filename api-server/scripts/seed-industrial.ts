import { db } from "../src/lib/prisma";

const sectors = [
  { nome: "Corte", capacidadeMin: 480, cargaPlanejadaMin: 360 },
  { nome: "Dobra", capacidadeMin: 480, cargaPlanejadaMin: 330 },
  { nome: "Solda", capacidadeMin: 480, cargaPlanejadaMin: 520 },
  { nome: "Montagem", capacidadeMin: 480, cargaPlanejadaMin: 300 },
  { nome: "Acabamento", capacidadeMin: 480, cargaPlanejadaMin: 420 },
  { nome: "Polimento", capacidadeMin: 360, cargaPlanejadaMin: 210 },
  { nome: "Expedição", capacidadeMin: 360, cargaPlanejadaMin: 180 },
];

const materials = [
  {
    codigo: "INOX-304-1200",
    descricao: "Chapa inox 304 escovada 1,20mm",
    categoria: "chapa inox",
    unidade: "folha",
    estoqueMinimo: 20,
    estoqueAtual: 42,
    estoqueReservado: 18,
    localizacao: "A1-03",
    lotePadrao: "L2605-88",
    custoMedio: 690,
  },
  {
    codigo: "TUBO-304-40X40",
    descricao: "Tubo quadrado inox 40x40x1,5",
    categoria: "tubo",
    unidade: "barra",
    estoqueMinimo: 30,
    estoqueAtual: 76,
    estoqueReservado: 31,
    localizacao: "B2-01",
    lotePadrao: "L2605-42",
    custoMedio: 148,
  },
  {
    codigo: "PERFIL-U-INOX",
    descricao: "Perfil U inox para acabamento",
    categoria: "perfil",
    unidade: "barra",
    estoqueMinimo: 18,
    estoqueAtual: 13,
    estoqueReservado: 10,
    localizacao: "C1-09",
    lotePadrao: "L2604-19",
    custoMedio: 96,
  },
  {
    codigo: "RODIZIO-INOX-4",
    descricao: "Rodízio industrial inox 4 polegadas",
    categoria: "acessorio",
    unidade: "un",
    estoqueMinimo: 24,
    estoqueAtual: 8,
    estoqueReservado: 12,
    localizacao: "D4-12",
    lotePadrao: "L2603-71",
    custoMedio: 55,
  },
];

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const sector of sectors) {
    const row = await db.setor.upsert({
      where: { nome: sector.nome },
      update: { tipo: "producao", descricao: `Setor fabril: ${sector.nome}` },
      create: {
        nome: sector.nome,
        tipo: "producao",
        descricao: `Setor fabril: ${sector.nome}`,
      },
    });

    await db.capacidadeSetor.upsert({
      where: {
        setorId_data_turno: {
          setorId: row.id,
          data: today,
          turno: "A",
        },
      },
      update: {
        capacidadeMin: sector.capacidadeMin,
        cargaPlanejadaMin: sector.cargaPlanejadaMin,
        status: sector.cargaPlanejadaMin >= sector.capacidadeMin ? "gargalo" : "operando",
      },
      create: {
        setorId: row.id,
        data: today,
        turno: "A",
        capacidadeMin: sector.capacidadeMin,
        cargaPlanejadaMin: sector.cargaPlanejadaMin,
        status: sector.cargaPlanejadaMin >= sector.capacidadeMin ? "gargalo" : "operando",
      },
    });
  }

  for (const material of materials) {
    await db.material.upsert({
      where: { codigo: material.codigo },
      update: material,
      create: material,
    });
  }

  console.log(`Industrial seed concluido: ${sectors.length} setores, ${materials.length} materiais.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
