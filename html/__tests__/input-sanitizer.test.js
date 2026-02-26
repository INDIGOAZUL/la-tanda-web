/**
 * Unit Tests for Input Sanitizer
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Mock the input sanitizer functions
const escapeHTML = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

const stripTags = (str) => {
  const div = document.createElement('div');
  div.innerHTML = str;
  return div.textContent || div.innerText || '';
};

const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(email) && email.length <= 254;
};

const validatePhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

const detectInjection = (str) => {
  const patterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  return patterns.some(pattern => pattern.test(str));
};

describe('Input Sanitizer', () => {
  
  describe('escapeHTML', () => {
    test('should escape HTML special characters', () => {
      expect(escapeHTML('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert("xss")&lt;/script&gt;'
      );
    });
    
    test('should escape quotes', () => {
      expect(escapeHTML('"\test"''\))
        .toContain('&quot;');
    });
  });
  
  describe('stripTags', () => {
    test('should remove HTML tags', () => {
      expect(stripTags('<b>Hello</b> World')).toBe('Hello World');
    });
    
    test('should remove script tags', () => {
      expect(stripTags('<script>alert(1)</script>Hello')).toBe('Hello');
    });
  });
  
  describe('validateEmail', () => {
    test('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
    });
    
    test('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });
    
    test('should reject emails over 254 characters', () => {
      const longEmail = 'a'.repeat(255) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });
  });
  
  describe('validatePhone', () => {
    test('should validate correct phone numbers', () => {
      expect(validatePhone('+1234567890')).toBe(true);
      expect(validatePhone('(123) 456-7890')).toBe(true);
    });
    
    test('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('12345678901234567')).toBe(false);
    });
  });
  
  describe('detectInjection', () => {
    test('should detect script injection', () => {
      expect(detectInjection('<script>alert(1)</script>')).toBe(true);
      expect(detectInjection('javascript:alert(1)')).toBe(true);
    });
    
    test('should detect event handler injection', () => {
      expect(detectInjection('<img onerror=alert(1)>')).toBe(true);
      expect(detectInjection('onclick=malicious()')).toBe(true);
    });
    
    test('should not flag safe input', () => {
      expect(detectInjection('Hello World')).toBe(false);
      expect(detectInjection('user@example.com')).toBe(false);
    });
  });
  
});
