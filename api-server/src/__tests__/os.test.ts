import request from 'supertest';
import app from '../app';
import { mockPrismaClient } from './setup';

describe('Ordem de Serviço Routes', () => {
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

  it('should return an empty OS list', async () => {
    mockPrismaClient.ordemServico.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/os')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should return OS details for a valid ID', async () => {
    mockPrismaClient.ordemServico.findUnique.mockResolvedValue({
      id: 1,
      numero: 'OS-0001',
      vendaId: 1,
      clienteId: 1,
      dataInicio: '2026-05-27',
      dataTermino: '2026-06-01',
      prioridade: 'alta',
      status: 'em_producao',
      etapaAtual: 'corte',
      observacoesGerais: 'Teste',
      observacoesCortedobra: null,
      observacoesSolda: null,
      arquivoProjeto: null,
      createdAt: new Date(),
      cliente: {
        id: 1,
        razaoSocial: 'Test Cliente Ltda',
        nomeFantasia: 'Test Cliente',
      },
    });
    mockPrismaClient.oSObservacao.findMany.mockResolvedValue([]);
    mockPrismaClient.oSHistoricoStatus.findMany.mockResolvedValue([]);
    mockPrismaClient.oSEtapaProducao.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/os/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('numero', 'OS-0001');
    expect(response.body.data).toHaveProperty('cliente');
  });

  it('should advance OS stage when valid', async () => {
    mockPrismaClient.ordemServico.findUnique.mockResolvedValue({
      id: 1,
      etapaAtual: 'corte',
      status: 'em_producao',
    });
    mockPrismaClient.oSEtapaProducao.findFirst.mockResolvedValue(null);
    mockPrismaClient.ordemServico.update.mockResolvedValue({
      id: 1,
      etapaAtual: 'dobra',
      status: 'em_producao',
    });

    const response = await request(app)
      .post('/api/os/1/avancar')
      .set('Authorization', `Bearer ${token}`)
      .send({ novaEtapa: 'dobra', observacao: 'Avançando para dobra' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('etapaAtual', 'dobra');
  });

  it('should create an observation for OS', async () => {
    const response = await request(app)
      .post('/api/os/1/observacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipoSetor: 'corte',
        observacao: 'Verificar peça',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('observacao', 'Verificar peça');
  });

  it('should return printable OS payload', async () => {
    mockPrismaClient.ordemServico.findUnique.mockResolvedValue({
      id: 1,
      numero: 'OS-0001',
      dataInicio: '2026-05-27',
      dataTermino: '2026-06-01',
      prioridade: 'alta',
      status: 'em_producao',
      etapaAtual: 'corte',
      observacoesGerais: 'Teste',
      createdAt: new Date(),
      cliente: {
        id: 1,
        razaoSocial: 'Test Cliente Ltda',
        nomeFantasia: 'Test Cliente',
        cnpjCpf: '12345678901',
        endereco: 'Rua Test',
        cidade: 'Test City',
        estado: 'TS',
        telefone: '1234567890',
      },
      venda: {
        numero: 'VND-0001',
        dataVenda: '2026-05-27',
        valorTotal: '500',
        itens: [
          {
            id: 1,
            produto: { codigo: 'PROD001', nome: 'Produto teste' },
            quantidade: 1,
            descricaoManual: 'Item teste',
          },
        ],
        orcamento: { numero: 'ORC-0001' },
      },
      etapas: [],
      historico: [],
    });

    const response = await request(app)
      .get('/api/os/1/imprimir')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('numero', 'OS-0001');
    expect(response.body.data.cliente).toHaveProperty('nomeFantasia', 'Test Cliente');
  });
});
