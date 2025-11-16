import { aggregatorService } from '../../src/services/aggregator.service';
import { cacheService } from '../../src/services/cache.service';

describe('AggregatorService', () => {
  beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await cacheService.flushAll();
    await cacheService.disconnect();
  });

  beforeEach(async () => {
    await cacheService.flushAll();
  });

  describe('searchTokens', () => {
    it('should search tokens from multiple sources', async () => {
      const tokens = await aggregatorService.searchTokens('SOL');

      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
      
      if (tokens.length > 0) {
        const token = tokens[0];
        expect(token).toHaveProperty('token_address');
        expect(token).toHaveProperty('token_name');
        expect(token).toHaveProperty('token_ticker');
        expect(token).toHaveProperty('price_sol');
      }
    }, 15000);

    it('should cache search results', async () => {
      const query = 'SOL';
      
      // First call - cache miss
      const startTime1 = Date.now();
      const result1 = await aggregatorService.searchTokens(query);
      const time1 = Date.now() - startTime1;

      // Second call - should be cached
      const startTime2 = Date.now();
      const result2 = await aggregatorService.searchTokens(query);
      const time2 = Date.now() - startTime2;

      expect(result2).toEqual(result1);
      expect(time2).toBeLessThan(time1); // Cached should be faster
    }, 20000);

    it('should handle empty search results', async () => {
      const tokens = await aggregatorService.searchTokens('NONEXISTENTTOKEN12345XYZ');
      
      expect(Array.isArray(tokens)).toBe(true);
      // May or may not return results depending on APIs
    }, 15000);
  });

  describe('getFilteredTokens', () => {
    it('should return paginated tokens', async () => {
      const result = await aggregatorService.getFilteredTokens({
        limit: 5,
        sortBy: 'volume',
        order: 'desc',
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(5);
      expect(result.pagination).toHaveProperty('limit');
      expect(result.pagination).toHaveProperty('total');
    }, 15000);

    it('should sort tokens by volume', async () => {
      const result = await aggregatorService.getFilteredTokens({
        limit: 10,
        sortBy: 'volume',
        order: 'desc',
      });

      if (result.data.length > 1) {
        for (let i = 0; i < result.data.length - 1; i++) {
          expect(result.data[i].volume_sol).toBeGreaterThanOrEqual(
            result.data[i + 1].volume_sol
          );
        }
      }
    }, 15000);

    it('should handle pagination cursor', async () => {
      const page1 = await aggregatorService.getFilteredTokens({
        limit: 5,
        sortBy: 'volume',
        order: 'desc',
      });

      if (page1.pagination.nextCursor) {
        const page2 = await aggregatorService.getFilteredTokens({
          limit: 5,
          cursor: page1.pagination.nextCursor,
          sortBy: 'volume',
          order: 'desc',
        });

        expect(page2.data).toBeDefined();
        // Pages should have different tokens (if enough data)
        if (page1.data.length > 0 && page2.data.length > 0) {
          expect(page1.data[0].token_address).not.toBe(page2.data[0].token_address);
        }
      }
    }, 20000);

    it('should filter by minimum volume', async () => {
      const minVolume = 100;
      const result = await aggregatorService.getFilteredTokens({
        limit: 10,
        minVolume,
      });

      result.data.forEach(token => {
        expect(token.volume_sol).toBeGreaterThanOrEqual(minVolume);
      });
    }, 15000);
  });

  describe('invalidateCache', () => {
    it('should invalidate cache pattern', async () => {
      // Create some cached data
      await aggregatorService.searchTokens('SOL');

      const deletedCount = await aggregatorService.invalidateCache();
      
      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    }, 15000);
  });
});
