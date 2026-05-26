import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para popular setores base no banco de dados
 * Execute com: npx ts-node scripts/seed-setores.ts
 */
async function seedSetores() {
  try {
    console.log('🌱 Iniciando seed de setores...');

    // Opcionalmente, limpar setores antigos
    // await prisma.setor.deleteMany({});

    // Criar setores se não existirem
    const setoresData = [
      {
        nome: 'Vendas',
        descricao: 'Departamento de Vendas',
        tipo: 'vendas',
      },
      {
        nome: 'Corte',
        descricao: 'Setor de Corte - Primeira etapa de produção',
        tipo: 'producao',
      },
      {
        nome: 'Dobra',
        descricao: 'Setor de Dobra - Segunda etapa de produção',
        tipo: 'producao',
      },
      {
        nome: 'Solda',
        descricao: 'Setor de Solda - Terceira etapa de produção',
        tipo: 'producao',
      },
      {
        nome: 'Montagem',
        descricao: 'Setor de Montagem - Quarta etapa de produção',
        tipo: 'producao',
      },
      {
        nome: 'Financeiro',
        descricao: 'Departamento Financeiro',
        tipo: 'financeiro',
      },
      {
        nome: 'Engenharia',
        descricao: 'Departamento de Engenharia e Projetos',
        tipo: 'producao',
      },
      {
        nome: 'Qualidade',
        descricao: 'Setor de Qualidade e Controle',
        tipo: 'producao',
      },
      {
        nome: 'Expedição',
        descricao: 'Setor de Expedição e Entrega',
        tipo: 'producao',
      },
    ];

    const setores = [];

    for (const data of setoresData) {
      // Verificar se já existe
      let setor = await prisma.setor.findUnique({
        where: { nome: data.nome },
      });

      // Se não existe, criar
      if (!setor) {
        setor = await prisma.setor.create({
          data,
        });
        console.log(`✅ Setor criado: ${data.nome}`);
      } else {
        console.log(`⏭️  Setor já existe: ${data.nome}`);
      }

      setores.push(setor);
    }

    console.log(`\n✅ Seed completo! ${setores.length} setores disponíveis`);

    // Listar setores criados
    console.log('\n📋 Setores:');
    setores.forEach((s) => {
      console.log(`   - ${s.nome} (${s.tipo})`);
    });
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
seedSetores();
