// tests/api/endpoints.test.js
const request = require('supertest');
const createApp = require('../../src/app-test');

// Create app instance for testing
const app = createApp();

describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK with status UP', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-API-Version', '1.0');
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'UP');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
  
  describe('GET /api/validation-test', () => {
    it('should return 200 OK with valid inputs', async () => {
      const response = await request(app)
        .get('/api/validation-test')
        .query({ testParam: 'validValue' })
        .set('X-API-Version', '1.0');
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Validation passed');
    });
    
    it('should return 400 Bad Request with invalid inputs', async () => {
      const response = await request(app)
        .get('/api/validation-test')
        .query({ testParam: '<script>alert("XSS")</script>' })
        .set('X-API-Version', '1.0');
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
  
  describe('POST /api/data', () => {
    it('should process valid data correctly', async () => {
      const testData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test message'
      };
      
      const response = await request(app)
        .post('/api/data')
        .set('X-API-Version', '1.0')
        .send(testData);
      
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject(testData);
    });
    
    it('should reject data with potential XSS', async () => {
      const maliciousData = {
        name: '<script>alert("XSS")</script>',
        email: 'test@example.com',
        message: 'This is a test message'
      };
      
      const response = await request(app)
        .post('/api/data')
        .set('X-API-Version', '1.0')
        .send(maliciousData);
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
  
  describe('Non-existent routes', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .set('X-API-Version', '1.0');
      
      expect(response.statusCode).toBe(404);
    });
  });
});
