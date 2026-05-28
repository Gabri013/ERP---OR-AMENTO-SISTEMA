import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    const clientes = await prisma.cliente.count();
    const usuarios = await prisma.usuario.count();
    const produtos = await prisma.produto.count();
    const setores = await prisma.setor.count();

    console.log('📊 Migration Verification:');
    console.log('Clientes:', clientes);
    console.log('Usuarios:', usuarios);
    console.log('Produtos:', produtos);
    console.log('Setores:', setores);

    // Show some sample data
    const sampleClientes = await prisma.cliente.findMany({ take: 3 });
    console.log('\n📋 Sample Clientes:');
    sampleClientes.forEach(c => console.log(`- ${c.razaoSocial}`));

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();
