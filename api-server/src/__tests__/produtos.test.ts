import request from 'supertest';
import { app } from '../app';

describe('Produtos Routes', () => {
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

  describe('GET /api/produtos', () => {
    it('should list produtos with valid auth', async () => {
      const response = await request(app)
        .get('/api/produtos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/produtos');

      expect(response.status).toBe(401);
    });

    it('should support search query', async () => {
      const response = await request(app)
        .get('/api/produtos?q=test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/produtos?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('meta');
    });
  });

  describe('POST /api/produtos', () => {
    it('should create produto with valid data', async () => {
      const response = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          codigo: 'PROD-001',
          nome: 'Test Produto',
          descricao: 'Test description',
          valor: 100.50,
          estoque: 10,
          status: 'ativo'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nome).toBe('Test Produto');
    });

    it('should return 400 with negative valor', async () => {
      const response = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Test Produto',
          valor: -10
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 with missing nome', async () => {
      const response = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          valor: 100
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/produtos/:id', () => {
    it('should get produto by id', async () => {
      // First create a produto
      const createResponse = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Get Test Produto',
          valor: 50
        });

      const produtoId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/produtos/${produtoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(produtoId);
    });

    it('should return 404 for non-existent produto', async () => {
      const response = await request(app)
        .get('/api/produtos/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/produtos/:id', () => {
    it('should update produto', async () => {
      // First create a produto
      const createResponse = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Update Test Produto',
          valor: 50
        });

      const produtoId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/produtos/${produtoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          descricao: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.descricao).toBe('Updated description');
    });

    it('should return 400 with negative valor', async () => {
      const response = await request(app)
        .patch('/api/produtos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          valor: -10
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/produtos/:id', () => {
    it('should delete produto', async () => {
      // First create a produto
      const createResponse = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Delete Test Produto',
          valor: 50
        });

      const produtoId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/produtos/${produtoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent produto', async () => {
      const response = await request(app)
        .delete('/api/produtos/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
