// src/middleware/sanitizeRequest.js

/**
 * Sanitizes a string by removing potentially dangerous HTML/JS
 * 
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove script tags and their contents
  let sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove other potentially dangerous HTML attributes
  sanitized = sanitized.replace(/(on\w+)=["']?[^"']*["']?/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove eval and other dangerous JS functions
  sanitized = sanitized.replace(/eval\((.*)\)/gi, '');
  
  return sanitized;
};

/**
 * Recursively sanitizes all string values in an object
 * 
 * @param {Object|Array|string} data - The data to sanitize
 * @returns {Object|Array|string} - Sanitized data
 */
const sanitizeData = (data) => {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle strings
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  
  // Return unchanged for other types (numbers, booleans, etc.)
  return data;
};

/**
 * Middleware to sanitize request body to prevent XSS attacks
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const sanitizeRequestBody = (req, res, next) => {
  // Only process if there's a body
  if (req.body && Object.keys(req.body).length > 0) {
    req.body = sanitizeData(req.body);
  }
  
  // Also sanitize query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    req.query = sanitizeData(req.query);
  }
  
  next();
};

module.exports = sanitizeRequestBody;
