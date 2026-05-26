import request from 'supertest';
import { app } from '../app';

describe('Clientes Routes', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@cozinca.com',
        senha: 'admin123'
      });
    authToken = loginResponse.body.data.token;
  });

  describe('GET /api/clientes', () => {
    it('should list clientes with valid auth', async () => {
      const response = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/clientes');

      expect(response.status).toBe(401);
    });

    it('should support search query', async () => {
      const response = await request(app)
        .get('/api/clientes?q=test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/clientes?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('meta');
    });
  });

  describe('POST /api/clientes', () => {
    it('should create cliente with valid data', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razaoSocial: 'Test Cliente Ltda',
          nomeFantasia: 'Test Cliente',
          cnpjCpf: '12.345.678/0001-90',
          email: 'test@example.com',
          telefone: '(11) 99999-9999',
          endereco: 'Rua Teste, 123',
          cidade: 'São Paulo',
          estado: 'SP'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.razaoSocial).toBe('Test Cliente Ltda');
    });

    it('should return 400 with invalid email', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razaoSocial: 'Test Cliente Ltda',
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 with missing razaoSocial', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
    });

    it('should return 403 without admin role', async () => {
      // Login as vendedor
      const vendedorLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'vendedor@cozinca.com',
          senha: 'vendedor123'
        });
      const vendedorToken = vendedorLogin.body.data.token;

      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          razaoSocial: 'Test Cliente Ltda'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/clientes/:id', () => {
    it('should get cliente by id', async () => {
      // First create a cliente
      const createResponse = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razaoSocial: 'Get Test Cliente'
        });

      const clienteId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/clientes/${clienteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(clienteId);
    });

    it('should return 404 for non-existent cliente', async () => {
      const response = await request(app)
        .get('/api/clientes/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/clientes/:id', () => {
    it('should update cliente', async () => {
      // First create a cliente
      const createResponse = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razaoSocial: 'Update Test Cliente'
        });

      const clienteId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/clientes/${clienteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nomeFantasia: 'Updated Nome Fantasia'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.nomeFantasia).toBe('Updated Nome Fantasia');
    });

    it('should return 400 with invalid email', async () => {
      const response = await request(app)
        .patch('/api/clientes/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/clientes/:id', () => {
    it('should delete cliente', async () => {
      // First create a cliente
      const createResponse = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razaoSocial: 'Delete Test Cliente'
        });

      const clienteId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/clientes/${clienteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent cliente', async () => {
      const response = await request(app)
        .delete('/api/clientes/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
