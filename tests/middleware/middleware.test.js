// tests/middleware/middleware.test.js
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const apiVersionMiddleware = require('../../src/middleware/apiVersionCheck');
const sanitizeRequestBody = require('../../src/middleware/sanitizeRequest');

describe('Middleware Tests', () => {
  
  describe('API Version Check Middleware', () => {
    let app;
    
    beforeEach(() => {
      // Create a fresh app for each test
      app = express();
      app.use(apiVersionMiddleware);
      app.get('/test', (req, res) => {
        res.status(200).json({ status: 'success' });
      });
    });
    
    it('should allow requests with valid API version header', async () => {
      const response = await request(app)
        .get('/test')
        .set('X-API-Version', '1.0');
      
      expect(response.statusCode).toBe(200);
    });
    
    it('should reject requests without API version header', async () => {
      const response = await request(app)
        .get('/test');
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'API version header is required');
    });
    
    it('should reject requests with unsupported API version', async () => {
      const response = await request(app)
        .get('/test')
        .set('X-API-Version', '0.5');
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'API version not supported');
    });
  });
  
  describe('Request Sanitization Middleware', () => {
    let app;
    
    beforeEach(() => {
      // Create a fresh app for each test
      app = express();
      app.use(bodyParser.json());
      app.use(sanitizeRequestBody);
      
      app.post('/test', (req, res) => {
        res.status(200).json({ 
          status: 'success',
          data: req.body
        });
      });
    });
    
    it('should allow clean request bodies', async () => {
      const testData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello World!'
      };
      
      const response = await request(app)
        .post('/test')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toEqual(testData);
    });
    
    it('should sanitize request bodies with potential XSS', async () => {
      const dirtyData = {
        name: '<script>alert("XSS")</script>John Doe',
        email: 'john@example.com',
        message: 'Hello <img src="x" onerror="alert(\'XSS\')" />'
      };
      
      const response = await request(app)
        .post('/test')
        .send(dirtyData);
      
      expect(response.statusCode).toBe(200);
      // Check that potentially malicious content was sanitized
      expect(response.body.data.name).not.toContain('<script>');
      expect(response.body.data.message).not.toContain('onerror');
    });
    
    it('should handle deeply nested objects with potential XSS', async () => {
      const complexData = {
        user: {
          profile: {
            name: '<script>alert("XSS")</script>John Doe',
            details: {
              bio: 'Bio with <img src="x" onerror="alert(\'XSS\')" />'
            }
          }
        },
        comments: [
          { text: 'Comment 1 <script>alert("XSS")</script>' },
          { text: 'Normal comment' }
        ]
      };
      
      const response = await request(app)
        .post('/test')
        .send(complexData);
      
      expect(response.statusCode).toBe(200);
      // Check that XSS is sanitized in nested objects
      expect(response.body.data.user.profile.name).not.toContain('<script>');
      expect(response.body.data.user.profile.details.bio).not.toContain('onerror');
      expect(response.body.data.comments[0].text).not.toContain('<script>');
    });
  });
});
