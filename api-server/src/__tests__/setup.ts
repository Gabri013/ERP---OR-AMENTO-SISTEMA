// @ts-nocheck
import { jest } from '@jest/globals';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock Redis module - must be before any imports
jest.mock('../lib/redis', () => ({
  getRedisClient: jest.fn(() => null),
  cacheGet: jest.fn(() => Promise.resolve(null)),
  cacheSet: jest.fn(() => Promise.resolve()),
  cacheDel: jest.fn(() => Promise.resolve()),
  withCache: jest.fn((key: string, ttl: number, fn: () => Promise<any>) => fn()),
}), { virtual: true });

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  default: {
    compare: jest.fn((password: string, hash: string) => {
      if (password === 'admin123' && hash === 'hashed_admin123') {
        return Promise.resolve(true);
      }
      if (password === 'vendedor123' && hash === 'hashed_vendedor123') {
        return Promise.resolve(true);
      }
      if (password === 'financeiro123' && hash === 'hashed_financeiro123') {
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }),
    hash: jest.fn((password: string) => Promise.resolve('hashed_' + password)),
  },
  compare: jest.fn((password: string, hash: string) => {
    if (password === 'admin123' && hash === 'hashed_admin123') {
      return Promise.resolve(true);
    }
    if (password === 'vendedor123' && hash === 'hashed_vendedor123') {
      return Promise.resolve(true);
    }
    if (password === 'financeiro123' && hash === 'hashed_financeiro123') {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }),
  hash: jest.fn((password: string) => Promise.resolve('hashed_' + password)),
}), { virtual: true });

// Mock JWT functions
jest.mock('../lib/jwt', () => ({
  signUserToken: jest.fn((claims) => Promise.resolve('mock_access_token_' + claims.sub)),
  signRefreshToken: jest.fn((claims) => Promise.resolve('mock_refresh_token_' + claims.sub)),
  verifyUserToken: jest.fn((token) => {
    // Return different claims based on token
    if (token === 'mock_access_token_1') {
      return Promise.resolve({ sub: 1, nome: 'Admin User', email: 'admin@cozinca.com', tipo: 'master' });
    }
    if (token === 'mock_access_token_2') {
      return Promise.resolve({ sub: 2, nome: 'Vendedor User', email: 'vendedor@cozinca.com', tipo: 'vendedor' });
    }
    if (token === 'mock_access_token_3') {
      return Promise.resolve({ sub: 3, nome: 'Financeiro User', email: 'financeiro@cozinca.com', tipo: 'financeiro' });
    }
    if (token && token.startsWith('mock_access_token_')) {
      return Promise.resolve({ sub: 1, nome: 'Admin User', email: 'admin@cozinca.com', tipo: 'master' });
    }
    return Promise.resolve(null);
  }),
  verifyRefreshToken: jest.fn((token) => {
    // Return different claims based on token
    if (token === 'mock_refresh_token_1') {
      return Promise.resolve({ sub: 1, nome: 'Admin User', email: 'admin@cozinca.com', tipo: 'master' });
    }
    if (token === 'mock_refresh_token_2') {
      return Promise.resolve({ sub: 2, nome: 'Vendedor User', email: 'vendedor@cozinca.com', tipo: 'vendedor' });
    }
    if (token === 'mock_refresh_token_3') {
      return Promise.resolve({ sub: 3, nome: 'Financeiro User', email: 'financeiro@cozinca.com', tipo: 'financeiro' });
    }
    if (token && token.startsWith('mock_refresh_token_')) {
      return Promise.resolve({ sub: 1, nome: 'Admin User', email: 'admin@cozinca.com', tipo: 'master' });
    }
    return Promise.resolve(null);
  }),
}));

// Mock external services used by routes
jest.mock('../lib/email', () => ({
  sendOrcamentoEmail: jest.fn(async () => Promise.resolve()),
  sendVendaEmail: jest.fn(async () => Promise.resolve()),
  sendOSEmail: jest.fn(async () => Promise.resolve()),
}), { virtual: true });

jest.mock('../lib/pdf', () => ({
  generateOrcamentoPDF: jest.fn(async () => Promise.resolve(Buffer.from('PDF'))),
  generateOSPDF: jest.fn(async () => Promise.resolve(Buffer.from('PDF'))),
}), { virtual: true });

// Mock Prisma with proper mock implementation
const mockPrismaClient: any = {
  $disconnect: jest.fn(),
  $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }] as any),
  $queryRawUnsafe: jest.fn().mockResolvedValue([
    {
      id: 1,
      vendaId: 1,
      clienteId: 1,
      parcelaNumero: 1,
      totalParcelas: 1,
      valorBruto: '100',
      valorLiquido: '100',
      valorRecebido: '0',
      dataVencimento: '2026-05-31',
      dataPagamento: null,
      formaPagamento: 'pix',
      status: 'PENDENTE',
      c_id: 1,
      razaoSocial: 'Test Cliente Ltda',
      nomeFantasia: 'Test Cliente',
      cnpjCpf: '12345678901',
      cidade: 'Test City',
      estado: 'TS',
      telefone: '1234567890',
      email: 'test@test.com',
      observacoes: null,
      c_created: new Date(),
    },
  ] as any),
  usuario: {
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      if (where.email === 'admin@cozinca.com') {
        return Promise.resolve({
          id: 1,
          email: 'admin@cozinca.com',
          nome: 'Admin User',
          senha: 'hashed_admin123',
          tipo: 'master',
          status: 'ativo',
        });
      }
      if (where.email === 'vendedor@cozinca.com') {
        return Promise.resolve({
          id: 2,
          email: 'vendedor@cozinca.com',
          nome: 'Vendedor User',
          senha: 'hashed_vendedor123',
          tipo: 'vendedor',
          status: 'ativo',
        });
      }
      if (where.email === 'financeiro@cozinca.com') {
        return Promise.resolve({
          id: 3,
          email: 'financeiro@cozinca.com',
          nome: 'Financeiro User',
          senha: 'hashed_financeiro123',
          tipo: 'financeiro',
          status: 'ativo',
        });
      }
      if (where.id === 1) {
        return Promise.resolve({
          id: 1,
          email: 'admin@cozinca.com',
          nome: 'Admin User',
          senha: 'hashed_admin123',
          tipo: 'master',
          status: 'ativo',
        });
      }
      if (where.id === 2) {
        return Promise.resolve({
          id: 2,
          email: 'vendedor@cozinca.com',
          nome: 'Vendedor User',
          senha: 'hashed_vendedor123',
          tipo: 'vendedor',
          status: 'ativo',
        });
      }
      if (where.id === 3) {
        return Promise.resolve({
          id: 3,
          email: 'financeiro@cozinca.com',
          nome: 'Financeiro User',
          senha: 'hashed_financeiro123',
          tipo: 'financeiro',
          status: 'ativo',
        });
      }
      return Promise.resolve(null);
    }),
    findMany: jest.fn().mockResolvedValue([] as any),
    create: jest.fn().mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      nome: 'Test User',
      senha: 'hashed_password',
      tipo: 'vendedor',
      status: 'ativo',
    } as any),
    update: jest.fn().mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      nome: 'Test User',
      senha: 'hashed_password',
      tipo: 'vendedor',
      status: 'ativo',
    } as any),
    delete: jest.fn().mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      nome: 'Test User',
      senha: 'hashed_password',
      tipo: 'vendedor',
      status: 'ativo',
    } as any),
  },
  cliente: {
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      if (where.id === 1) {
        return Promise.resolve({
          id: 1,
          razaoSocial: 'Test Cliente Ltda',
          nomeFantasia: 'Test Cliente',
          cnpjCpf: '12345678901',
          endereco: 'Rua Test',
          cidade: 'Test City',
          estado: 'TS',
          cep: '12345678',
          telefone: '1234567890',
          email: 'test@test.com',
        });
      }
      return Promise.resolve(null);
    }),
    findMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        razaoSocial: 'Test Cliente Ltda',
        nomeFantasia: 'Test Cliente',
        cnpjCpf: '12345678901',
        endereco: 'Rua Test',
        cidade: 'Test City',
        estado: 'TS',
        cep: '12345678',
        telefone: '1234567890',
        email: 'test@test.com',
      }
    ] as any),
    count: jest.fn().mockResolvedValue(1),
    create: jest.fn().mockResolvedValue({
      id: 1,
      razaoSocial: 'Test Cliente Ltda',
      nomeFantasia: 'Test Cliente',
      cnpjCpf: '12345678901',
      endereco: 'Rua Test',
      cidade: 'Test City',
      estado: 'TS',
      cep: '12345678',
      telefone: '1234567890',
      email: 'test@test.com',
    } as any),
    update: jest.fn().mockResolvedValue({
      id: 1,
      razaoSocial: 'Test Cliente Ltda',
      nomeFantasia: 'Updated Nome Fantasia',
      cnpjCpf: '12345678901',
      endereco: 'Rua Test',
      cidade: 'Test City',
      estado: 'TS',
      cep: '12345678',
      telefone: '1234567890',
      email: 'test@test.com',
    } as any),
    delete: jest.fn().mockResolvedValue({
      id: 1,
      razaoSocial: 'Deleted Cliente',
      nomeFantasia: 'Deleted',
      cnpjCpf: '12345678901',
      endereco: 'Rua Deleted',
      cidade: 'Deleted City',
      estado: 'DS',
      cep: '12345678',
      telefone: '1234567890',
      email: 'deleted@test.com',
    } as any),
  },
  produto: {
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      if (where.id === 1) {
        return Promise.resolve({
          id: 1,
          codigo: 'PROD001',
          nome: 'Test Produto',
          descricao: 'Test Description',
          foto: null,
          valor: '100',
          estoque: 10,
          status: 'ativo',
        });
      }
      return Promise.resolve(null);
    }),
    findMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        codigo: 'PROD001',
        nome: 'Test Produto',
        descricao: 'Test Description',
        foto: null,
        valor: '100',
        estoque: 10,
        status: 'ativo',
      }
    ] as any),
    count: jest.fn().mockResolvedValue(1),
    create: jest.fn().mockResolvedValue({
      id: 1,
      codigo: 'PROD001',
      nome: 'Test Produto',
      descricao: 'Test description',
      foto: null,
      valor: '100',
      estoque: 10,
      status: 'ativo',
    } as any),
    update: jest.fn().mockResolvedValue({
      id: 1,
      codigo: 'PROD001',
      nome: 'Test Produto',
      descricao: 'Updated description',
      foto: null,
      valor: '100',
      estoque: 10,
      status: 'ativo',
    } as any),
    delete: jest.fn().mockResolvedValue({
      id: 1,
      codigo: 'PROD001',
      nome: 'Deleted Produto',
      descricao: 'Deleted Description',
      foto: null,
      valor: '100',
      estoque: 10,
      status: 'ativo',
    } as any),
  },
  orcamento: {
    count: jest.fn().mockResolvedValue(1),
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      if (where.id === 1) {
        return Promise.resolve({
          id: 1,
          numero: 'ORC-0001',
          clienteId: 1,
          usuarioId: 1,
          dataOrcamento: '2026-05-27',
          validade: '2026-06-27',
          valorTotal: 500,
          desconto: 0,
          status: 'pendente',
          observacoes: null,
          createdAt: new Date(),
        } as any);
      }
      return Promise.resolve(null);
    }),
    findMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        numero: 'ORC-0001',
        clienteId: 1,
        usuarioId: 1,
        dataOrcamento: '2026-05-27',
        validade: '2026-06-27',
        valorTotal: 500,
        desconto: 0,
        status: 'pendente',
        observacoes: null,
        createdAt: new Date(),
        cliente: {
          id: 1,
          razaoSocial: 'Test Cliente Ltda',
          nomeFantasia: 'Test Cliente',
          cnpjCpf: '12345678901',
          cidade: 'Test City',
          estado: 'TS',
          telefone: '1234567890',
          email: 'test@test.com',
          observacoes: null,
          createdAt: new Date(),
        },
      },
    ] as any),
    create: jest.fn().mockImplementation(async ({ data }: any) => ({
      id: 1,
      numero: 'ORC-0001',
      ...data,
      valorTotal: Number(data.valorTotal),
      desconto: data.desconto ?? 0,
      createdAt: new Date(),
    } as any)),
    update: jest.fn().mockImplementation(async ({ where, data }: any) => ({
      id: where.id,
      numero: 'ORC-0001',
      clienteId: 1,
      usuarioId: 1,
      dataOrcamento: '2026-05-27',
      validade: '2026-06-27',
      valorTotal: 500,
      desconto: 0,
      status: data.status ?? 'pendente',
      observacoes: data.observacoes ?? null,
      createdAt: new Date(),
    } as any)),
    delete: jest.fn().mockResolvedValue({ id: 1 } as any),
  },
  orcamentoItem: {
    create: jest.fn().mockImplementation(async ({ data }: any) => ({
      id: 1,
      ...data,
    } as any)),
    findMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        orcamentoId: 1,
        produtoId: 1,
        descricaoManual: 'Test item',
        quantidade: 1,
        valorUnitario: 100,
        valorTotal: 100,
      },
    ] as any),
  },
  venda: {
    count: jest.fn().mockResolvedValue(1),
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      if (where.id === 1) {
        return Promise.resolve({
          id: 1,
          numero: 'VND-0001',
          clienteId: 1,
          usuarioId: 1,
          dataVenda: '2026-05-27',
          valorTotal: 500,
          desconto: 0,
          formaPagamento: 'pix',
          numParcelas: 1,
          status: 'em_andamento',
          observacoes: null,
          observacoesVenda: null,
          createdAt: new Date(),
        } as any);
      }
      return Promise.resolve(null);
    }),
    findMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        numero: 'VND-0001',
        clienteId: 1,
        usuarioId: 1,
        dataVenda: '2026-05-27',
        valorTotal: 500,
        desconto: 0,
        formaPagamento: 'pix',
        numParcelas: 1,
        status: 'em_andamento',
        observacoes: null,
        observacoesVenda: null,
        createdAt: new Date(),
        cliente: {
          id: 1,
          razaoSocial: 'Test Cliente Ltda',
          nomeFantasia: 'Test Cliente',
          cnpjCpf: '12345678901',
          cidade: 'Test City',
          estado: 'TS',
          telefone: '1234567890',
          email: 'test@test.com',
          observacoes: null,
          createdAt: new Date(),
        },
        ordensServico: [],
      },
    ] as any),
    create: jest.fn().mockImplementation(async ({ data }: any) => ({
      id: 1,
      numero: 'VND-0001',
      ...data,
      valorTotal: Number(data.valorTotal),
      desconto: data.desconto ?? 0,
      createdAt: new Date(),
    } as any)),
    update: jest.fn().mockResolvedValue({ id: 1 } as any),
    delete: jest.fn().mockResolvedValue({ id: 1 } as any),
  },
  vendaItem: {
    create: jest.fn().mockImplementation(async ({ data }: any) => ({
      id: 1,
      ...data,
    } as any)),
    findMany: jest.fn().mockResolvedValue([] as any),
  },
  contaReceber: {
    create: jest.fn().mockImplementation(async ({ data }: any) => ({
      id: 1,
      ...data,
    } as any)),
  },
  ordemServico: {
    findUnique: jest.fn().mockResolvedValue(null as any),
    findMany: jest.fn().mockResolvedValue([] as any),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockResolvedValue({ id: 1 } as any),
    update: jest.fn().mockResolvedValue({ id: 1 } as any),
    delete: jest.fn().mockResolvedValue({ id: 1 } as any),
  },
  oSObservacao: {
    create: jest.fn().mockImplementation(async ({ data }: any) => ({ id: 1, ...data } as any)),
    findMany: jest.fn().mockResolvedValue([] as any),
  },
  oSHistoricoStatus: {
    create: jest.fn().mockImplementation(async ({ data }: any) => ({ id: 1, ...data } as any)),
    findMany: jest.fn().mockResolvedValue([] as any),
  },
  oSEtapaProducao: {
    findMany: jest.fn().mockResolvedValue([] as any),
    updateMany: jest.fn().mockResolvedValue({ count: 1 } as any),
    findFirst: jest.fn().mockResolvedValue(null as any),
    create: jest.fn().mockImplementation(async ({ data }: any) => ({ id: 1, ...data } as any)),
  },
  contaReceber: {
    create: jest.fn().mockImplementation(async ({ data }: any) => ({
      id: 1,
      vendaId: data.vendaId,
      clienteId: data.clienteId,
      parcelaNumero: data.parcelaNumero,
      totalParcelas: data.totalParcelas,
      valorBruto: String(data.valorBruto),
      valorLiquido: String(data.valorLiquido),
      valorRecebido: data.valorRecebido,
      dataVencimento: data.dataVencimento,
      dataPagamento: data.dataPagamento,
      formaPagamento: data.formaPagamento,
      status: data.status,
      createdAt: new Date(),
    } as any)),
    update: jest.fn().mockImplementation(async ({ where, data }: any) => ({
      id: where.id,
      vendaId: 1,
      clienteId: 1,
      parcelaNumero: 1,
      totalParcelas: 1,
      valorBruto: '100',
      valorLiquido: '100',
      valorRecebido: data.valorRecebido,
      dataVencimento: '2026-05-31',
      dataPagamento: data.dataPagamento,
      formaPagamento: data.formaPagamento,
      status: data.status,
      createdAt: new Date(),
    } as any)),
  },
  pagamento: {
    create: jest.fn().mockImplementation(async ({ data }: any) => ({ id: 1, ...data } as any)),
  },
  contaPagar: {
    findMany: jest.fn().mockResolvedValue([] as any),
    create: jest.fn().mockImplementation(async ({ data }: any) => ({
      id: 1,
      descricao: data.descricao,
      fornecedor: data.fornecedor,
      valor: String(data.valor),
      dataVencimento: data.dataVencimento,
      status: 'PENDENTE',
      createdAt: new Date(),
    } as any)),
    update: jest.fn().mockImplementation(async ({ where, data }: any) => ({
      id: where.id,
      descricao: 'Existing Conta',
      fornecedor: 'Fornecedor Ltda',
      valor: '100',
      dataVencimento: '2026-05-31',
      dataPagamento: data.dataPagamento,
      status: data.status,
      createdAt: new Date(),
    } as any)),
  },
  refreshToken: {
    create: jest.fn().mockResolvedValue({ id: 1, token: 'mock_refresh_token_1', usuarioId: 1, expiresAt: new Date() } as any),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 } as any),
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      if (where.token === 'mock_refresh_token_1') {
        return Promise.resolve({ id: 1, token: 'mock_refresh_token_1', usuarioId: 1, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } as any);
      }
      return Promise.resolve(null);
    }),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: 1 } as any),
    findMany: jest.fn().mockResolvedValue([] as any),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
}), { virtual: true });

// Export the mock for use in tests
export { mockPrismaClient };
