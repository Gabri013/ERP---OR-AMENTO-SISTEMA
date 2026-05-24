import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const user = await prisma.usuario.upsert({
      where: { email: 'test@test.com' },
      update: {},
      create: {
        nome: 'Test User',
        email: 'test@test.com',
        senha: hashedPassword,
        tipo: 'master',
        status: 'ativo',
        telefoneWhatsapp: '11999999999'
      }
    });
    
    console.log('Usuário de teste criado/atualizado:', user);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
