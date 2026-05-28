import request from 'supertest';
import app from '../app';
import { mockPrismaClient } from './setup';

describe('Vendas Routes', () => {
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

  it('should create venda with valid itens', async () => {
    const response = await request(app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clienteId: 1,
        dataVenda: '2026-05-27',
        desconto: 0,
        formaPagamento: 'pix',
        numParcelas: 2,
        itens: [
          {
            produtoId: 1,
            descricaoManual: 'Teste de venda',
            quantidade: 2,
            valorUnitario: 100,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('numero');
    expect(response.body.data.numero).toMatch(/^VND-\d{4}$/);
    expect(response.body.data.clienteId).toBe(1);
    expect(response.body.data.formaPagamento).toBe('pix');
  });

  it('should list vendas with pagination metadata', async () => {
    const response = await request(app)
      .get('/api/vendas')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('meta');
    expect(response.body.meta).toHaveProperty('page');
  });

  it('should reject venda with empty itens', async () => {
    const response = await request(app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clienteId: 1,
        dataVenda: '2026-05-27',
        itens: [],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
