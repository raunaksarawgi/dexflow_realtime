import { cacheService } from '../../src/services/cache.service';

describe('CacheService', () => {
  beforeAll(async () => {
    // Wait for Redis connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await cacheService.flushAll();
    await cacheService.disconnect();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await cacheService.flushAll();
  });

  describe('set and get operations', () => {
    it('should set and get a string value', async () => {
      const key = 'test:string';
      const value = 'Hello World';

      await cacheService.set(key, value, 60);
      const result = await cacheService.get<string>(key);

      expect(result).toBe(value);
    });

    it('should set and get an object value', async () => {
      const key = 'test:object';
      const value = { name: 'Test Token', price: 100 };

      await cacheService.set(key, value, 60);
      const result = await cacheService.get<typeof value>(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('non:existent:key');
      expect(result).toBeNull();
    });

    it('should handle TTL expiration', async () => {
      const key = 'test:ttl';
      const value = 'expires soon';

      await cacheService.set(key, value, 1); // 1 second TTL
      
      // Should exist immediately
      let result = await cacheService.get<string>(key);
      expect(result).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Should be expired
      result = await cacheService.get<string>(key);
      expect(result).toBeNull();
    }, 10000);
  });

  describe('delete operations', () => {
    it('should delete a key', async () => {
      const key = 'test:delete';
      const value = 'will be deleted';

      await cacheService.set(key, value, 60);
      expect(await cacheService.get<string>(key)).toBe(value);

      await cacheService.delete(key);
      expect(await cacheService.get<string>(key)).toBeNull();
    });

    it('should delete multiple keys by pattern', async () => {
      await cacheService.set('test:pattern:1', 'value1', 60);
      await cacheService.set('test:pattern:2', 'value2', 60);
      await cacheService.set('test:other:3', 'value3', 60);

      const deletedCount = await cacheService.deletePattern('test:pattern:*');
      
      expect(deletedCount).toBe(2);
      expect(await cacheService.get('test:pattern:1')).toBeNull();
      expect(await cacheService.get('test:pattern:2')).toBeNull();
      expect(await cacheService.get('test:other:3')).toBe('value3');
    });
  });

  describe('exists and ttl operations', () => {
    it('should check if key exists', async () => {
      const key = 'test:exists';
      
      expect(await cacheService.exists(key)).toBe(false);
      
      await cacheService.set(key, 'value', 60);
      
      expect(await cacheService.exists(key)).toBe(true);
    });

    it('should get TTL for a key', async () => {
      const key = 'test:ttl:check';
      await cacheService.set(key, 'value', 100);

      const ttl = await cacheService.ttl(key);
      
      // TTL should be close to 100 seconds
      expect(ttl).toBeGreaterThan(90);
      expect(ttl).toBeLessThanOrEqual(100);
    });
  });

  describe('connection status', () => {
    it('should report connection status', () => {
      const status = cacheService.getConnectionStatus();
      expect(typeof status).toBe('boolean');
    });
  });
});
