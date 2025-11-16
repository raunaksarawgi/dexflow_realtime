import { RateLimiter } from '../../src/utils/rateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(5, 1000); // 5 requests per second for testing
  });

  afterEach(() => {
    limiter.resetAll();
  });

  describe('canMakeRequest', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test:user:1';

      expect(limiter.canMakeRequest(identifier)).toBe(true);
      expect(limiter.canMakeRequest(identifier)).toBe(true);
      expect(limiter.canMakeRequest(identifier)).toBe(true);
    });

    it('should block requests when limit exceeded', () => {
      const identifier = 'test:user:2';

      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        expect(limiter.canMakeRequest(identifier)).toBe(true);
      }

      // 6th request should be blocked
      expect(limiter.canMakeRequest(identifier)).toBe(false);
    });

    it('should reset after window expires', async () => {
      const identifier = 'test:user:3';

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        limiter.canMakeRequest(identifier);
      }

      expect(limiter.canMakeRequest(identifier)).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should allow requests again
      expect(limiter.canMakeRequest(identifier)).toBe(true);
    }, 10000);

    it('should track different identifiers separately', () => {
      const user1 = 'test:user:4';
      const user2 = 'test:user:5';

      // Exhaust limit for user1
      for (let i = 0; i < 5; i++) {
        limiter.canMakeRequest(user1);
      }

      expect(limiter.canMakeRequest(user1)).toBe(false);
      expect(limiter.canMakeRequest(user2)).toBe(true); // user2 should still work
    });
  });

  describe('getRemainingRequests', () => {
    it('should return correct remaining requests', () => {
      const identifier = 'test:user:6';

      expect(limiter.getRemainingRequests(identifier)).toBe(5);

      limiter.canMakeRequest(identifier);
      expect(limiter.getRemainingRequests(identifier)).toBe(4);

      limiter.canMakeRequest(identifier);
      expect(limiter.getRemainingRequests(identifier)).toBe(3);
    });
  });

  describe('getResetTime', () => {
    it('should return valid reset time', () => {
      const identifier = 'test:user:7';
      
      limiter.canMakeRequest(identifier);
      const resetTime = limiter.getResetTime(identifier);
      const now = Date.now();

      expect(resetTime).toBeGreaterThan(now);
      expect(resetTime).toBeLessThanOrEqual(now + 1000);
    });
  });

  describe('waitForSlot', () => {
    it('should wait and retry when rate limited', async () => {
      const identifier = 'test:user:8';
      const quickLimiter = new RateLimiter(2, 500); // 2 requests per 500ms

      // Exhaust limit
      quickLimiter.canMakeRequest(identifier);
      quickLimiter.canMakeRequest(identifier);

      const startTime = Date.now();
      const result = await quickLimiter.waitForSlot(identifier, 3);
      const elapsed = Date.now() - startTime;

      expect(result).toBe(true);
      expect(elapsed).toBeGreaterThan(400); // Should have waited
    }, 10000);

    it('should return false after max retries', async () => {
      const identifier = 'test:user:9';
      const strictLimiter = new RateLimiter(1, 10000); // Very strict

      strictLimiter.canMakeRequest(identifier); // Use up the slot

      const result = await strictLimiter.waitForSlot(identifier, 1);
      
      expect(result).toBe(false);
    }, 15000);
  });

  describe('reset operations', () => {
    it('should reset specific identifier', () => {
      const identifier = 'test:user:10';

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        limiter.canMakeRequest(identifier);
      }

      expect(limiter.canMakeRequest(identifier)).toBe(false);

      limiter.reset(identifier);

      expect(limiter.canMakeRequest(identifier)).toBe(true);
    });

    it('should reset all identifiers', () => {
      const user1 = 'test:user:11';
      const user2 = 'test:user:12';

      // Exhaust limits for both
      for (let i = 0; i < 5; i++) {
        limiter.canMakeRequest(user1);
        limiter.canMakeRequest(user2);
      }

      expect(limiter.canMakeRequest(user1)).toBe(false);
      expect(limiter.canMakeRequest(user2)).toBe(false);

      limiter.resetAll();

      expect(limiter.canMakeRequest(user1)).toBe(true);
      expect(limiter.canMakeRequest(user2)).toBe(true);
    });
  });
});
