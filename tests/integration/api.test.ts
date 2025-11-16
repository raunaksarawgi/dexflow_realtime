import request from 'supertest';
import express, { Application } from 'express';
import routes from '../../src/controllers/routes';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';
import { cacheService } from '../../src/services/cache.service';

describe('API Endpoints Integration Tests', () => {
  let app: Application;

  beforeAll(async () => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api', routes);
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Wait for Redis connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await cacheService.flushAll();
    await cacheService.disconnect();
  });

  beforeEach(async () => {
    await cacheService.flushAll();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data.status).toBe('healthy');
    });
  });

  describe('GET /api/tokens', () => {
    it('should return paginated tokens list', async () => {
      const response = await request(app)
        .get('/api/tokens')
        .query({ limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination.limit).toBe(10);
    }, 15000);

    it('should accept sorting parameters', async () => {
      const response = await request(app)
        .get('/api/tokens')
        .query({ 
          limit: 5, 
          sortBy: 'volume', 
          order: 'desc' 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBeLessThanOrEqual(5);
    }, 15000);

    it('should accept period filter', async () => {
      const response = await request(app)
        .get('/api/tokens')
        .query({ 
          limit: 5, 
          period: '24h' 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    }, 15000);

    it('should reject invalid limit', async () => {
      const response = await request(app)
        .get('/api/tokens')
        .query({ limit: 150 }) // Over 100
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toBe('INVALID_LIMIT');
    });

    it('should reject invalid sortBy parameter', async () => {
      const response = await request(app)
        .get('/api/tokens')
        .query({ sortBy: 'invalid_field' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SORT_BY');
    });

    it('should reject invalid order parameter', async () => {
      const response = await request(app)
        .get('/api/tokens')
        .query({ order: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ORDER');
    });

    it('should reject invalid period parameter', async () => {
      const response = await request(app)
        .get('/api/tokens')
        .query({ period: '30d' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PERIOD');
    });
  });

  describe('GET /api/search', () => {
    it('should search tokens by query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'SOL' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    }, 15000);

    it('should reject empty search query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_QUERY');
    });

    it('should reject missing search query', async () => {
      const response = await request(app)
        .get('/api/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_QUERY');
    });
  });

  describe('GET /api/tokens/:address', () => {
    it('should return token by valid address', async () => {
      // Use a known Solana token address
      const address = 'So11111111111111111111111111111111111111112'; // Wrapped SOL

      const response = await request(app)
        .get(`/api/tokens/${address}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token_address');
    }, 15000);

    it('should reject invalid token address', async () => {
      const response = await request(app)
        .get('/api/tokens/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ADDRESS');
    });

    it('should return 404 for non-existent token', async () => {
      // Use a valid format but likely non-existent address
      const fakeAddress = '1111111111111111111111111111111111111111';

      const response = await request(app)
        .get(`/api/tokens/${fakeAddress}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_NOT_FOUND');
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
    });
  });

  describe('Response Format', () => {
    it('should have consistent response format for success', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('number');
    });

    it('should have consistent response format for errors', async () => {
      const response = await request(app)
        .get('/api/tokens')
        .query({ limit: 150 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('statusCode');
    });
  });
});
