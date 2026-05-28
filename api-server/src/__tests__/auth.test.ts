import request from 'supertest';
import speakeasy from 'speakeasy';
import app from '../app';
import { mockPrismaClient } from './setup';

describe('Authentication Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@cozinca.com',
          senha: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@cozinca.com',
          senha: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          senha: 'password123'
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          senha: 'password123'
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@cozinca.com'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout with valid token', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@cozinca.com',
          senha: 'admin123'
        });

      const { token, refreshToken } = loginResponse.body.data;

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('ok', true);
    });

    it('should logout without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@cozinca.com',
          senha: 'admin123'
        });

      const { token } = loginResponse.body.data;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('nome');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // First login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@cozinca.com',
          senha: 'admin123'
        });

      const { refreshToken } = loginResponse.body.data;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' });

      expect(response.status).toBe(401);
    });

    it('should return 400 with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('2FA Routes', () => {
    it('should setup 2FA for authenticated user', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@cozinca.com',
          senha: 'admin123',
        });

      const { token } = loginResponse.body.data;
      const response = await request(app)
        .post('/api/auth/2fa/setup')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('secret');
      expect(response.body.data).toHaveProperty('otpauthUrl');
      expect(response.body.data).toHaveProperty('qrCodeDataUrl');
      expect(response.body.data).toHaveProperty('backupCodes');
      expect(Array.isArray(response.body.data.backupCodes)).toBe(true);
      expect(response.body.data.backupCodes.length).toBeGreaterThanOrEqual(8);
    });

    it('should verify 2FA setup and enable 2FA', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@cozinca.com',
          senha: 'admin123',
        });

      const { token } = loginResponse.body.data;
      const setupResponse = await request(app)
        .post('/api/auth/2fa/setup')
        .set('Authorization', `Bearer ${token}`)
        .send();

      const secret = setupResponse.body.data.secret;
      const totpToken = speakeasy.totp({ secret, encoding: 'base32' });

      const response = await request(app)
        .post('/api/auth/2fa/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ token: totpToken, secret });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('enabled', true);
      expect(response.body.data.backupCodes).toBeInstanceOf(Array);
      expect(response.body.data.backupCodes.length).toBeGreaterThanOrEqual(8);
      expect(mockPrismaClient.usuario.update).toHaveBeenLastCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          backupCodes: expect.any(Array),
        }),
      });
    });

    it('should disable 2FA with valid password', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@cozinca.com',
          senha: 'admin123',
        });

      const { token } = loginResponse.body.data;

      const originalFindUnique = mockPrismaClient.usuario.findUnique;
      mockPrismaClient.usuario.findUnique = jest.fn(async ({ where }: any) => {
        if (where.id === 1) {
          return {
            id: 1,
            email: 'admin@cozinca.com',
            nome: 'Admin User',
            senha: 'hashed_admin123',
            tipo: 'master',
            status: 'ativo',
            twoFactorEnabled: true,
            twoFactorSecret: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
            backupCodes: ['BACKUP1', 'BACKUP2'],
          };
        }
        return Promise.resolve(null);
      }) as any;

      const response = await request(app)
        .post('/api/auth/2fa/disable')
        .set('Authorization', `Bearer ${token}`)
        .send({ senha: 'admin123' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('disabled', true);
      expect(mockPrismaClient.usuario.update).toHaveBeenLastCalledWith({
        where: { id: 1 },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: [],
        },
      });

      mockPrismaClient.usuario.findUnique = originalFindUnique;
    });

    it('should login with valid 2FA totp token when enabled', async () => {
      const secret = speakeasy.generateSecret({ length: 20 }).base32;
      const totpToken = speakeasy.totp({ secret, encoding: 'base32' });

      const originalFindUnique = mockPrismaClient.usuario.findUnique;
      mockPrismaClient.usuario.findUnique = jest.fn(async ({ where }: any) => {
        if (where.email === 'admin@cozinca.com') {
          return {
            id: 1,
            email: 'admin@cozinca.com',
            nome: 'Admin User',
            senha: 'hashed_admin123',
            tipo: 'master',
            status: 'ativo',
            twoFactorEnabled: true,
            twoFactorSecret: secret,
            backupCodes: ['BACKUP1', 'BACKUP2'],
          };
        }

        if (where.id === 1) {
          return {
            id: 1,
            email: 'admin@cozinca.com',
            nome: 'Admin User',
            senha: 'hashed_admin123',
            tipo: 'master',
            status: 'ativo',
            twoFactorEnabled: true,
            twoFactorSecret: secret,
            backupCodes: ['BACKUP1', 'BACKUP2'],
          };
        }

        return Promise.resolve(null);
      }) as any;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@cozinca.com',
          senha: 'admin123',
          totpToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');

      mockPrismaClient.usuario.findUnique = originalFindUnique;
    });
  });
});
