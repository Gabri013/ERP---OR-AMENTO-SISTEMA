import request from 'supertest';
import app from '../app';
import { mockPrismaClient } from './setup';

describe('Financeiro Routes', () => {
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

  it('should list contas receber', async () => {
    mockPrismaClient.$queryRawUnsafe.mockResolvedValueOnce([
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
    ]);

    const response = await request(app)
      .get('/api/financeiro/contas-receber')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data[0]).toHaveProperty('status', 'PENDENTE');
  });

  it('should pay a conta receber', async () => {
    mockPrismaClient.contaReceber.update.mockResolvedValueOnce({
      id: 1,
      clienteId: 1,
      valorRecebido: '100',
      dataPagamento: new Date(),
      formaPagamento: 'pix',
      status: 'PAGO',
    });
    mockPrismaClient.pagamento.create.mockResolvedValueOnce({
      id: 1,
      contaReceberId: 1,
      usuarioId: 1,
      valorPago: 100,
      formaPagamento: 'pix',
      observacao: 'Pago',
    });

    const response = await request(app)
      .post('/api/financeiro/contas-receber/1/pagar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorPago: 100,
        formaPagamento: 'pix',
        observacao: 'Pago',
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('status', 'PAGO');
  });

  it('should create a conta a pagar', async () => {
    const response = await request(app)
      .post('/api/financeiro/contas-pagar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        descricao: 'Fatura teste',
        fornecedor: 'Fornecedor Ltda',
        valor: 250,
        dataVencimento: '2026-06-30',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('descricao', 'Fatura teste');
  });

  it('should pay a conta a pagar', async () => {
    mockPrismaClient.contaPagar.update.mockResolvedValueOnce({
      id: 1,
      descricao: 'Fatura teste',
      fornecedor: 'Fornecedor Ltda',
      valor: '250',
      dataVencimento: '2026-06-30',
      dataPagamento: new Date(),
      status: 'PAGO',
    });

    const response = await request(app)
      .post('/api/financeiro/contas-pagar/1/pagar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorPago: 250,
        formaPagamento: 'pix',
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('status', 'PAGO');
  });
});
