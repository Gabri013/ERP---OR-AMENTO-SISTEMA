import { PrismaClient, TipoUsuario, StatusOrcamento, StatusVenda, StatusOS, StatusConta, Prioridade, EtapaProducao } from '@prisma/client';
import { readFileSync } from 'node:fs';

const prisma = new PrismaClient();

function isValidDate(d: any): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

function safeParseFloat(val: any, def: number = 0): number {
  const n = parseFloat(val);
  return isNaN(n) ? def : n;
}

function safeParseInt(val: any, def: number = 0): number {
  const n = parseInt(val);
  return isNaN(n) ? def : n;
}

function safeDate(val: any): Date {
  const d = new Date(val);
  return isValidDate(d) ? d : new Date();
}

const idMaps: { [key: string]: Map<number, number> } = {
  cliente: new Map(),
  usuario: new Map(),
  produto: new Map(),
  orcamento: new Map(),
  venda: new Map(),
  ordemServico: new Map(),
  contaReceber: new Map(),
};

async function migrateFromMySQL() {
  try {
    console.log('🚀 Starting FULL migration from dbcozinca.sql...');

    const sqlContent = readFileSync('../dbcozinca.sql', 'utf-8');
    const oldToNewId = (table: string, oldId: number): number | null => {
      const map = idMaps[table];
      return map ? map.get(oldId) ?? null : null;
    };

    // Migrate clientes first and map IDs
    console.log('\n📋 Migrating clientes...');
    const clientesInserts = parseInsertStatements(sqlContent, 'clientes');
    console.log(`📊 Found ${clientesInserts.length} clientes records`);
    let clientesCreated = 0;
    for (const cliente of clientesInserts) {
      try {
        const created = await prisma.cliente.create({
          data: {
            razaoSocial: cliente.razao_social || '',
            nomeFantasia: cliente.nome_fantasia || null,
            cnpjCpf: cliente.cnpj_cpf || null,
            endereco: cliente.endereco || null,
            cidade: cliente.cidade || null,
            estado: cliente.estado || null,
            telefone: cliente.telefone || null,
            email: cliente.email || null,
            observacoes: cliente.observacoes || null,
            createdAt: safeDate(cliente.created_at),
            updatedAt: safeDate(cliente.updated_at),
          },
        });
        idMaps.cliente.set(safeParseInt(cliente.id), created.id);
        clientesCreated++;
      } catch (error: any) {
        console.log(`⚠️  Error migrating cliente ${cliente.razao_social}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${clientesCreated}/${clientesInserts.length} clientes`);

    // Migrate usuarios
    console.log('\n📋 Migrating usuarios...');
    const usuariosInserts = parseInsertStatements(sqlContent, 'usuarios');
    const bcrypt = await import('bcryptjs');
    let usuariosCreated = 0;
    for (const usuario of usuariosInserts) {
      try {
        const senha = usuario.senha && !usuario.senha.startsWith('$2b$')
          ? await bcrypt.hash(usuario.senha, 10)
          : usuario.senha || '123456';

        const created = await prisma.usuario.create({
          data: {
            nome: usuario.nome || '',
            email: usuario.email || '',
            senha: senha,
            tipo: mapTipoUsuario(usuario.tipo) as TipoUsuario,
            status: usuario.status || 'ativo',
            telefoneWhatsapp: usuario.telefone || null,
            createdAt: safeDate(usuario.created_at),
            updatedAt: safeDate(usuario.updated_at),
          },
        });
        idMaps.usuario.set(safeParseInt(usuario.id), created.id);
        usuariosCreated++;
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`⏭️  Usuario already exists: ${usuario.email}`);
        } else console.log(`⚠️  Error migrating usuario ${usuario.email}:`, e.message);
      }
    }
    console.log(`✅ Migrated ${usuariosCreated}/${usuariosInserts.length} usuarios`);

    // Migrate produtos
    console.log('\n📋 Migrating produtos...');
    const produtosInserts = parseInsertStatements(sqlContent, 'produtos');
    let produtosCreated = 0;
    for (const produto of produtosInserts) {
      try {
        const created = await prisma.produto.create({
          data: {
            codigo: produto.codigo || null,
            nome: produto.nome || '',
            descricao: produto.descricao || null,
            valor: safeParseFloat(produto.valor),
            estoque: safeParseInt(produto.estoque),
            status: produto.status || 'ativo',
            tipoProduto: produto.tipo || 'padrao',
            createdAt: safeDate(produto.created_at),
            updatedAt: safeDate(produto.updated_at),
          },
        });
        idMaps.produto.set(safeParseInt(produto.id), created.id);
        produtosCreated++;
      } catch (error: any) {
        console.log(`⚠️  Error migrating produto ${produto.nome}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${produtosCreated}/${produtosInserts.length} produtos`);

    // Migrate orcamentos
    console.log('\n📋 Migrating orcamentos...');
    const orcamentosInserts = parseInsertStatements(sqlContent, 'orcamentos');
    let orcamentosCreated = 0;
    for (const orcamento of orcamentosInserts) {
      try {
        const clienteNewId = oldToNewId('cliente', safeParseInt(orcamento.cliente_id));
        const usuarioNewId = oldToNewId('usuario', safeParseInt(orcamento.usuario_id));
        if (!clienteNewId || !usuarioNewId) continue;
        
        const created = await prisma.orcamento.create({
          data: {
            numero: orcamento.numero || '',
            clienteId: clienteNewId,
            usuarioId: usuarioNewId,
            dataOrcamento: safeDate(orcamento.data_orcamento),
            validade: orcamento.validade ? safeDate(orcamento.validade) : null,
            valorTotal: safeParseFloat(orcamento.valor_total),
            desconto: safeParseFloat(orcamento.desconto),
            status: mapStatusOrcamento(orcamento.status),
            observacoes: orcamento.observacoes || null,
            createdAt: safeDate(orcamento.created_at),
            updatedAt: safeDate(orcamento.updated_at),
          },
        });
        idMaps.orcamento.set(safeParseInt(orcamento.id), created.id);
        orcamentosCreated++;
      } catch (error: any) {
        console.log(`⚠️  Error migrating orcamento ${orcamento.numero}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${orcamentosCreated}/${orcamentosInserts.length} orcamentos`);

    // Migrate orcamentos_itens
    console.log('\n📋 Migrating orcamentos_itens...');
    const orcamentosItensInserts = parseInsertStatements(sqlContent, 'orcamentos_itens');
    let orcamentosItensCreated = 0;
    for (const item of orcamentosItensInserts) {
      try {
        const orcamentoNewId = oldToNewId('orcamento', safeParseInt(item.orcamento_id));
        const produtoNewId = item.produto_id ? oldToNewId('produto', safeParseInt(item.produto_id)) : null;
        if (!orcamentoNewId) continue;
        
        await prisma.orcamentoItem.create({
          data: {
            orcamentoId: orcamentoNewId,
            produtoId: produtoNewId,
            descricaoManual: item.descricao_manual || null,
            quantidade: safeParseFloat(item.quantidade, 1),
            valorUnitario: safeParseFloat(item.valor_unitario),
            valorTotal: safeParseFloat(item.valor_total),
            createdAt: safeDate(item.created_at),
          },
        });
        orcamentosItensCreated++;
      } catch (error: any) {
        console.log(`⚠️  Error migrating orcamento item ${item.id}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${orcamentosItensCreated}/${orcamentosItensInserts.length} orcamentos_itens`);

    // Migrate vendas
    console.log('\n📋 Migrating vendas...');
    const vendasInserts = parseInsertStatements(sqlContent, 'vendas');
    let vendasCreated = 0;
    for (const venda of vendasInserts) {
      try {
        const clienteNewId = oldToNewId('cliente', safeParseInt(venda.cliente_id));
        const usuarioNewId = oldToNewId('usuario', safeParseInt(venda.usuario_id));
        const orcamentoNewId = venda.orcamento_id ? oldToNewId('orcamento', safeParseInt(venda.orcamento_id)) : null;
        if (!clienteNewId || !usuarioNewId) continue;
        
        const created = await prisma.venda.create({
          data: {
            numero: venda.numero || '',
            orcamentoId: orcamentoNewId,
            clienteId: clienteNewId,
            usuarioId: usuarioNewId,
            dataVenda: safeDate(venda.data_venda),
            valorTotal: safeParseFloat(venda.valor_total),
            desconto: safeParseFloat(venda.desconto),
            formaPagamento: venda.forma_pagamento || null,
            numParcelas: safeParseInt(venda.num_parcelas, 1),
            status: mapStatusVenda(venda.status),
            observacoes: venda.observacoes || null,
            createdAt: safeDate(venda.created_at),
            updatedAt: safeDate(venda.updated_at),
          },
        });
        idMaps.venda.set(safeParseInt(venda.id), created.id);
        vendasCreated++;
      } catch (error: any) {
        console.log(`⚠️  Error migrating venda ${venda.numero}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${vendasCreated}/${vendasInserts.length} vendas`);

    // Migrate ordens_servico
    console.log('\n📋 Migrating ordens_servico...');
    const ordensServicoInserts = parseInsertStatements(sqlContent, 'ordens_servico');
    let ordensServicoCreated = 0;
    for (const os of ordensServicoInserts) {
      try {
        const clienteNewId = oldToNewId('cliente', safeParseInt(os.cliente_id));
        const vendaNewId = os.venda_id ? oldToNewId('venda', safeParseInt(os.venda_id)) : null;
        if (!clienteNewId) continue;
        
        const created = await prisma.ordemServico.create({
          data: {
            numero: os.numero || '',
            vendaId: vendaNewId,
            clienteId: clienteNewId,
            dataInicio: safeDate(os.data_inicio),
            dataTermino: os.data_termino ? safeDate(os.data_termino) : null,
            prioridade: mapPrioridade(os.prioridade),
            status: mapStatusOS(os.status),
            etapaAtual: mapEtapaProducao(os.etapa_atual),
            observacoesGerais: os.observacoes || null,
            arquivoProjeto: os.arquivo_projeto || null,
            createdAt: safeDate(os.created_at),
            updatedAt: safeDate(os.updated_at),
          },
        });
        idMaps.ordemServico.set(safeParseInt(os.id), created.id);
        ordensServicoCreated++;
      } catch (error: any) {
        console.log(`⚠️  Error migrating OS ${os.numero}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${ordensServicoCreated}/${ordensServicoInserts.length} ordens_servico`);

    // Migrate contas_receber
    console.log('\n📋 Migrating contas_receber...');
    const contasReceberInserts = parseInsertStatements(sqlContent, 'contas_receber');
    let contasReceberCreated = 0;
    for (const cr of contasReceberInserts) {
      try {
        const vendaNewId = oldToNewId('venda', safeParseInt(cr.venda_id));
        const clienteNewId = oldToNewId('cliente', safeParseInt(cr.cliente_id));
        if (!vendaNewId || !clienteNewId) continue;
        
        const created = await prisma.contaReceber.create({
          data: {
            vendaId: vendaNewId,
            clienteId: clienteNewId,
            parcelaNumero: safeParseInt(cr.parcela_numero, 1),
            totalParcelas: safeParseInt(cr.total_parcelas, 1),
            valorBruto: safeParseFloat(cr.valor_bruto),
            valorLiquido: safeParseFloat(cr.valor_liquido),
            valorRecebido: safeParseFloat(cr.valor_recebido),
            dataVencimento: safeDate(cr.data_vencimento),
            dataPagamento: cr.data_pagamento ? safeDate(cr.data_pagamento) : null,
            formaPagamento: cr.forma_pagamento || null,
            status: mapStatusConta(cr.status),
            createdAt: safeDate(cr.created_at),
            updatedAt: safeDate(cr.updated_at),
          },
        });
        idMaps.contaReceber.set(safeParseInt(cr.id), created.id);
        contasReceberCreated++;
      } catch (error: any) {
        console.log(`⚠️  Error migrating conta receber ${cr.id}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${contasReceberCreated}/${contasReceberInserts.length} contas_receber`);

    // Migrate vendas_itens
    console.log('\n📋 Migrating vendas_itens...');
    const vendasItensInserts = parseInsertStatements(sqlContent, 'vendas_itens');
    let vendasItensCreated = 0;
    for (const item of vendasItensInserts) {
      try {
        const vendaNewId = oldToNewId('venda', safeParseInt(item.venda_id));
        const produtoNewId = item.produto_id ? oldToNewId('produto', safeParseInt(item.produto_id)) : null;
        if (!vendaNewId) continue;
        
        await prisma.vendaItem.create({
          data: {
            vendaId: vendaNewId,
            produtoId: produtoNewId,
            descricaoManual: item.descricao_manual || null,
            quantidade: safeParseFloat(item.quantidade, 1),
            valorUnitario: safeParseFloat(item.valor_unitario),
            valorTotal: safeParseFloat(item.valor_total),
            createdAt: safeDate(item.created_at),
          },
        });
        vendasItensCreated++;
      } catch (error: any) {
        console.log(`⚠️  Error migrating venda item ${item.id}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${vendasItensCreated}/${vendasItensInserts.length} vendas_itens`);

    // Migrate pagamentos
    console.log('\n📋 Migrating pagamentos...');
    const pagamentosInserts = parseInsertStatements(sqlContent, 'pagamentos');
    let pagamentosCreated = 0;
    for (const pg of pagamentosInserts) {
      try {
        const contaNewId = oldToNewId('contaReceber', safeParseInt(pg.conta_receber_id));
        const usuarioNewId = oldToNewId('usuario', safeParseInt(pg.usuario_id));
        if (!contaNewId) continue;
        
        await prisma.pagamento.create({
          data: {
            contaReceberId: contaNewId,
            usuarioId: usuarioNewId || 1,
            valorPago: safeParseFloat(pg.valor_pago),
            formaPagamento: pg.forma_pagamento || '',
            observacao: pg.observacao || null,
            createdAt: safeDate(pg.created_at),
          },
        });
        pagamentosCreated++;
      } catch (error: any) {
        console.log(`⚠️  Error migrating pagamento ${pg.id}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${pagamentosCreated}/${pagamentosInserts.length} pagamentos`);

    // Migrate contas_pagar
    console.log('\n📋 Migrating contas_pagar...');
    const contasPagarInserts = parseInsertStatements(sqlContent, 'contas_pagar');
    let contasPagarCreated = 0;
    for (const cp of contasPagarInserts) {
      try {
        await prisma.contaPagar.create({
          data: {
            descricao: cp.descricao || '',
            fornecedor: cp.fornecedor || null,
            valor: safeParseFloat(cp.valor),
            dataVencimento: safeDate(cp.data_vencimento),
            dataPagamento: cp.data_pagamento ? safeDate(cp.data_pagamento) : null,
            status: mapStatusConta(cp.status),
            createdAt: safeDate(cp.created_at),
            updatedAt: safeDate(cp.updated_at),
          },
        });
        contasPagarCreated++;
      } catch (error: any) {
        console.log(`⚠️  Error migrating conta pagar ${cp.id}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${contasPagarCreated}/${contasPagarInserts.length} contas_pagar`);

    console.log('\n🎉 FULL Migration completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Clientes: ${clientesCreated}`);
    console.log(`   - Usuarios: ${usuariosCreated}`);
    console.log(`   - Produtos: ${produtosCreated}`);
    console.log(`   - Orcamentos: ${orcamentosCreated}`);
    console.log(`   - Vendas: ${vendasCreated}`);
    console.log(`   - Ordens Servico: ${ordensServicoCreated}`);
    console.log(`   - Contas Receber: ${contasReceberCreated}`);
    console.log(`   - Vendas Itens: ${vendasItensCreated}`);
    console.log(`   - Pagamentos: ${pagamentosCreated}`);
    console.log(`   - Contas Pagar: ${contasPagarCreated}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function parseInsertStatements(sqlContent: string, tableName: string): any[] {
  const records: any[] = [];
  const insertRegex = new RegExp(`INSERT INTO \`${tableName}\` \\([^)]+\\) VALUES`, 'gi');
  const insertMatch = insertRegex.exec(sqlContent);

  if (!insertMatch) return records;

  const columnMatch = sqlContent.substring(insertMatch.index).match(/\(([^)]+)\)/);
  if (!columnMatch) return records;

  const columns = columnMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));

  const valuesStart = insertMatch.index + insertMatch[0].length;
  const nextSemicolon = sqlContent.indexOf(';', valuesStart);
  const nextCreate = sqlContent.indexOf('CREATE TABLE', valuesStart);
  const valuesEnd = Math.min(
    nextSemicolon !== -1 ? nextSemicolon : Infinity,
    nextCreate !== -1 ? nextCreate : Infinity
  );

  const valuesStr = sqlContent.substring(valuesStart, valuesEnd).trim();
  const values = parseValues(valuesStr);

  return values.map(row => {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

function parseValues(valuesStr: string): any[] {
  const records: any[] = [];
  const regex = /\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(valuesStr)) !== null) {
    const values = match[1].split(',').map(v => {
      v = v.trim();
      if (v === 'NULL') return null;
      if (v.startsWith("'") && v.endsWith("'")) {
        return v.slice(1, -1).replace(/''/g, "'").replace(/\\'/g, "'");
      }
      return v;
    });
    records.push(values);
  }

  return records;
}

function mapTipoUsuario(tipo: string): string {
  const tipoMap: { [key: string]: string } = {
    'admin': 'master', 'gerente': 'gerente', 'vendedor': 'vendedor',
    'financeiro': 'financeiro', 'producao': 'producao',
  };
  return tipoMap[tipo] || 'vendedor';
}

function mapStatusOrcamento(status: string): StatusOrcamento {
  const statusMap: { [key: string]: StatusOrcamento } = {
    'pendente': 'pendente', 'aprovado': 'em_projeto', 'convertido': 'convertido', 'cancelado': 'cancelada',
  };
  return statusMap[status] || 'pendente';
}

function mapStatusVenda(status: string): StatusVenda {
  const statusMap: { [key: string]: StatusVenda } = {
    'em_andamento': 'em_andamento', 'concluida': 'concluida', 'cancelada': 'cancelada',
  };
  return statusMap[status] || 'em_andamento';
}

function mapStatusOS(status: string): StatusOS {
  const statusMap: { [key: string]: StatusOS } = {
    'pendente': 'pendente', 'liberada': 'liberada', 'em_projeto': 'em_projeto',
    'em_revisao': 'em_revisao', 'em_producao': 'em_producao', 'pausado': 'pausado',
    'concluida': 'concluida', 'entregue': 'entregue', 'cancelado': 'cancelada',
  };
  return statusMap[status] || 'pendente';
}

function mapStatusConta(status: string): StatusConta {
  const statusMap: { [key: string]: StatusConta } = {
    'PENDENTE': 'PENDENTE', 'PAGO': 'PAGO', 'ATRASADO': 'ATRASADO',
    'CANCELADO': 'CANCELADO', 'PARCIALMENTE_PAGO': 'PARCIALMENTE_PAGO', 'RENEGOCIADO': 'RENEGOCIADO',
  };
  return statusMap[status] || 'PENDENTE';
}

function mapPrioridade(prioridade: string): Prioridade {
  const prioridadeMap: { [key: string]: Prioridade } = {
    'verde': 'verde', 'amarelo': 'amarelo', 'vermelho': 'vermelho',
  };
  return prioridadeMap[prioridade] || 'verde';
}

function mapEtapaProducao(etapa: string): EtapaProducao {
  const etapaMap: { [key: string]: EtapaProducao } = {
    'corte': 'corte', 'dobra': 'dobra', 'solda': 'solda', 'refrigeracao': 'refrigeracao',
    'acabamento': 'acabamento', 'finalizacao': 'finalizacao', 'montagem': 'montagem', 'autorizacao': 'autorizacao',
  };
  return etapaMap[etapa] || 'autorizacao';
}

migrateFromMySQL().catch(console.error);