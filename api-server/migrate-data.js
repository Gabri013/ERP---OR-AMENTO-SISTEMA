// Data migration script from NeonDB to Vercel Postgres
require('dotenv').config({ path: '.env.neon' });
const { PrismaClient } = require('@prisma/client');

// Source database (NeonDB)
const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Destination database (Vercel Postgres)
require('dotenv').config({ path: '.env.vercel' });
const destPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function migrateData() {
  try {
    console.log('Starting data migration from NeonDB to Vercel Postgres...');
    
    // List of models to migrate (in order to respect foreign key constraints)
    const migrationOrder = [
      'Cliente',
      'Usuario',
      'Produto',
      'Orcamento',
      'OrcamentoItem',
      'Venda',
      'VendaItem',
      'OrdemServico',
      'OSObservacao',
      'OSHistoricoStatus',
      'OSEtapaProducao',
      'ContaReceber',
      'ContaPagar',
      'Pagamento'
    ];
    
    for (const model of migrationOrder) {
      console.log(`\nMigrating ${model}...`);
      
      // Get the model name in lowercase for Prisma client
      const modelKey = model.toLowerCase();
      
      // Read all data from source
      const sourceData = await sourcePrisma[modelKey].findMany();
      
      if (sourceData.length === 0) {
        console.log(`  No data found for ${model}, skipping...`);
        continue;
      }
      
      console.log(`  Found ${sourceData.length} records to migrate`);
      
      // Clear destination table
      await destPrisma[modelKey].deleteMany({});
      
      // Insert data into destination in batches
      const batchSize = 100;
      for (let i = 0; i < sourceData.length; i += batchSize) {
        const batch = sourceData.slice(i, i + batchSize);
        await destPrisma[modelKey].createMany({
          data: batch,
          skipDuplicates: true
        });
        console.log(`  Migrated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sourceData.length/batchSize)}`);
      }
      
      console.log(`  ✓ ${model} migration completed`);
    }
    
    console.log('\n✅ Data migration completed successfully!');
    console.log('📊 Summary:');
    for (const model of migrationOrder) {
      const modelKey = model.toLowerCase();
      const count = await destPrisma[modelKey].count();
      console.log(`   ${model}: ${count} records`);
    }
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    throw error;
  } finally {
    await sourcePrisma.$disconnect();
    await destPrisma.$disconnect();
  }
}

// Run the migration
migrateData().catch(async (error) => {
  console.error('Migration failed:', error);
  await sourcePrisma.$disconnect();
  await destPrisma.$disconnect();
  process.exit(1);
});