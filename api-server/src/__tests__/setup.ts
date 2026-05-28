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

// Mock Prisma with proper mock implementation
const mockPrismaClient: any = {
  $disconnect: jest.fn(),
  $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }] as any),
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
    findUnique: jest.fn().mockResolvedValue(null as any),
    findMany: jest.fn().mockResolvedValue([] as any),
    create: jest.fn().mockResolvedValue({ id: 1 } as any),
    update: jest.fn().mockResolvedValue({ id: 1 } as any),
    delete: jest.fn().mockResolvedValue({ id: 1 } as any),
  },
  venda: {
    findUnique: jest.fn().mockResolvedValue(null as any),
    findMany: jest.fn().mockResolvedValue([] as any),
    create: jest.fn().mockResolvedValue({ id: 1 } as any),
    update: jest.fn().mockResolvedValue({ id: 1 } as any),
    delete: jest.fn().mockResolvedValue({ id: 1 } as any),
  },
  ordemServico: {
    findUnique: jest.fn().mockResolvedValue(null as any),
    findMany: jest.fn().mockResolvedValue([] as any),
    create: jest.fn().mockResolvedValue({ id: 1 } as any),
    update: jest.fn().mockResolvedValue({ id: 1 } as any),
    delete: jest.fn().mockResolvedValue({ id: 1 } as any),
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
