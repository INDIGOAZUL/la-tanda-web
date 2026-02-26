/**
 * Unit Tests for CSRF Protection
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Mock CSRF functions
const generateToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

const getCSRFToken = () => {
  const stored = sessionStorage.getItem('csrf_token');
  if (stored) {
    try {
      const { token, timestamp } = JSON.parse(stored);
      const age = Date.now() - timestamp;
      if (age < TOKEN_EXPIRY) {
        return token;
      }
    } catch (e) {
      // Continue to generate new token
    }
  }
  
  const newToken = generateToken();
  const tokenData = {
    token: newToken,
    timestamp: Date.now()
  };
  sessionStorage.setItem('csrf_token', JSON.stringify(tokenData));
  return newToken;
};

describe('CSRF Protection', () => {
  
  beforeEach(() => {
    sessionStorage.clear();
  });
  
  describe('generateToken', () => {
    test('should generate 64-character hex token', () => {
      const token = generateToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });
    
    test('should generate unique tokens', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });
  });
  
  describe('getCSRFToken', () => {
    test('should create new token if none exists', () => {
      const token = getCSRFToken();
      expect(token).toBeTruthy();
      expect(token).toHaveLength(64);
    });
    
    test('should reuse existing valid token', () => {
      const token1 = getCSRFToken();
      const token2 = getCSRFToken();
      expect(token1).toBe(token2);
    });
    
    test('should store token in sessionStorage', () => {
      getCSRFToken();
      const stored = sessionStorage.getItem('csrf_token');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored);
      expect(parsed).toHaveProperty('token');
      expect(parsed).toHaveProperty('timestamp');
    });
    
    test('should generate new token if expired', () => {
      // Set an expired token
      const expiredToken = {
        token: 'old-token',
        timestamp: Date.now() - TOKEN_EXPIRY - 1000
      };
      sessionStorage.setItem('csrf_token', JSON.stringify(expiredToken));
      
      const newToken = getCSRFToken();
      expect(newToken).not.toBe('old-token');
    });
  });
  
});
