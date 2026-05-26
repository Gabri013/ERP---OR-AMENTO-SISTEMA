import { generalLimiter, loginLimiter } from '../../middleware/rateLimiter';

describe('Rate Limiter Middleware', () => {
  it('should export general limiter', () => {
    expect(generalLimiter).toBeDefined();
    expect(generalLimiter).toHaveProperty('windowMs');
  });

  it('should export login limiter', () => {
    expect(loginLimiter).toBeDefined();
    expect(loginLimiter).toHaveProperty('windowMs');
  });

  it('should have stricter limits for login', () => {
    const generalMax = (generalLimiter as any).max;
    const loginMax = (loginLimiter as any).max;
    
    expect(loginMax).toBeLessThan(generalMax);
  });
});
