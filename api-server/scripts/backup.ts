import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Criar diretório se não existir
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

console.log('🔄 Iniciando backup do banco de dados...');

try {
  // Usar pg_dump via Prisma ou direto se disponível
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!directUrl) {
    throw new Error('DATABASE_URL ou DIRECT_URL não configurado');
  }

  // Executar pg_dump
  const result = execSync(`pg_dump "${directUrl}" --format=plain --verbose --no-password`, {
    stdio: ['pipe', 'pipe', 'pipe'],
    encoding: 'utf-8',
  });

  fs.writeFileSync(backupFile, result);
  console.log(`✅ Backup criado: ${backupFile}`);

  // Manter apenas últimos 7 backups
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f: string) => f.startsWith('backup-') && f.endsWith('.sql'))
    .map((f: string) => ({ 
      file: f, 
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() 
    }))
    .sort((a: any, b: any) => b.time - a.time);

  if (files.length > 7) {
    files.slice(7).forEach(({ file }: { file: string }) => {
      fs.unlinkSync(path.join(BACKUP_DIR, file));
      console.log(`🗑️  Removido backup antigo: ${file}`);
    });
  }

  console.log('✨ Backup concluído com sucesso!');
  process.exit(0);
} catch (error) {
  console.error('❌ Erro ao fazer backup:', error instanceof Error ? error.message : error);
  process.exit(1);
}
