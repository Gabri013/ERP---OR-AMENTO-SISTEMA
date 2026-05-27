import { generalLimiter, loginLimiter } from '../../middleware/rateLimiter';

describe('Rate Limiter Middleware', () => {
  it('should export general limiter', () => {
    expect(generalLimiter).toBeDefined();
    expect(typeof generalLimiter).toBe('function');
  });

  it('should export login limiter', () => {
    expect(loginLimiter).toBeDefined();
    expect(typeof loginLimiter).toBe('function');
  });

  it('should have different limiters for general and login', () => {
    expect(generalLimiter).not.toBe(loginLimiter);
  });
});
