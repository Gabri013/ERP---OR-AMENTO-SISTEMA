import request from 'supertest';
import app from '../app';
import { mockPrismaClient } from './setup';

describe('Orcamentos Routes', () => {
  let token: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@cozinca.com',
        senha: 'admin123',
      });

    token = loginRes.body.data.token;
  });

  it('should create orcamento with valid itens', async () => {
    const response = await request(app)
      .post('/api/orcamentos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clienteId: 1,
        dataOrcamento: '2026-05-27',
        validade: '2026-06-27',
        valorTotal: 200,
        desconto: 0,
        itens: [
          {
            produtoId: 1,
            descricaoManual: 'Produto de teste',
            quantidade: 2,
            valorUnitario: 100,
            valorTotal: 200,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('numero');
    expect(response.body.data.numero).toMatch(/^ORC-\d{4}$/);
    expect(response.body.data.cliente).toBeDefined();
    expect(response.body.data.valorTotal).toBe(200);
  });

  it('should reject orcamento without clienteId', async () => {
    const response = await request(app)
      .post('/api/orcamentos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        dataOrcamento: '2026-05-27',
        itens: [
          {
            produtoId: 1,
            quantidade: 1,
            valorUnitario: 100,
            valorTotal: 100,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should convert orcamento into venda', async () => {
    mockPrismaClient.orcamento.findUnique.mockImplementation(({ where }: any) => {
      if (where.id === 1) {
        return Promise.resolve({
          id: 1,
          numero: 'ORC-0001',
          clienteId: 1,
          usuarioId: 1,
          dataOrcamento: '2026-05-27',
          validade: '2026-06-27',
          valorTotal: 200,
          desconto: 0,
          status: 'pendente',
          observacoes: null,
          createdAt: new Date(),
        } as any);
      }
      return Promise.resolve(null);
    });

    const response = await request(app)
      .post('/api/orcamentos/1/converter')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data.numero).toMatch(/^VND-\d{4}$/);
    expect(response.body.data.clienteId).toBe(1);
  });

  it('should reject converter quando orçamento já convertido', async () => {
    let requestCount = 0;

    mockPrismaClient.orcamento.findUnique.mockImplementation(({ where }: any) => {
      if (where.id === 1) {
        requestCount += 1;
        return Promise.resolve({
          id: 1,
          numero: 'ORC-0001',
          clienteId: 1,
          usuarioId: 1,
          dataOrcamento: '2026-05-27',
          validade: '2026-06-27',
          valorTotal: 200,
          desconto: 0,
          status: requestCount === 1 ? 'pendente' : 'convertido',
          observacoes: null,
          createdAt: new Date(),
        } as any);
      }
      return Promise.resolve(null);
    });

    await request(app)
      .post('/api/orcamentos/1/converter')
      .set('Authorization', `Bearer ${token}`);

    const response = await request(app)
      .post('/api/orcamentos/1/converter')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message', 'Orçamento já convertido');
    expect(response.body.error).toHaveProperty('code', 'ALREADY_CONVERTED');
  });
});
