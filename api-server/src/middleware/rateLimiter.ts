import rateLimit from 'express-rate-limit';
import { getRedisClient } from '../lib/redis';

// ============================================================================
// RATE LIMITERS - Protegem contra abuso de requisições
// ============================================================================

const redis = getRedisClient();

/**
 * Geral: 100 requisições por 15 minutos (por usuário ou IP)
 * Aplicado globalmente em todas as rotas
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: 'Muitas requisições desta IP. Tente novamente em 15 minutos.',
  standardHeaders: true, // Retorna RateLimit-* headers
  legacyHeaders: false,
  skip: (req) => {
    // Não aplicar em health checks
    return req.path === '/api/health' || req.path === '/healthz';
  },
  keyGenerator: (req) => {
    // Usar user ID se autenticado, senão usar IP
    return (req as any).user?.id?.toString() || req.ip || req.socket.remoteAddress || 'unknown';
  },
});

/**
 * Login: 5 tentativas por 15 minutos
 * Previne brute force attacks em autenticação
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true, // Não contar tentativas bem-sucedidas
  skipFailedRequests: false,
  keyGenerator: (req) => (req.body?.email) || req.ip || 'unknown',
});

/**
 * API: 30 requisições por minuto
 * Rate limiting padrão para endpoints de dados
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  message: 'Limite de requisições atingido. Tente novamente.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Upload: 5 uploads por 10 minutos
 * Previne upload DoS attacks
 */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Limite de uploads atingido. Máximo 5 uploads por 10 minutos.',
  keyGenerator: (req) => (req as any).user?.id?.toString() || req.ip || 'unknown',
});

/**
 * Search: 20 buscas por minuto
 * Protege endpoint de search de queries caras
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Limite de buscas atingido.',
  keyGenerator: (req) => (req as any).user?.id?.toString() || req.ip || 'unknown',
});

// Export todos os limiters
export const rateLimiters = {
  general: generalLimiter,
  login: loginLimiter,
  api: apiLimiter,
  upload: uploadLimiter,
  search: searchLimiter,
};

export default generalLimiter;
