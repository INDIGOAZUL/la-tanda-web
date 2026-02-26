/**
 * Input Sanitization & Validation Module
 * Prevents XSS, SQL injection, and other input-based attacks
 */

/**
 * HTML entity encoding
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Remove HTML tags
 */
function stripTags(str) {
  const div = document.createElement('div');
  div.innerHTML = str;
  return div.textContent || div.innerText || '';
}

/**
 * Sanitize for safe HTML display
 */
function sanitizeHTML(html) {
  const allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'];
  const allowedAttributes = {
    'a': ['href', 'title', 'target']
  };
  
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Remove scripts
  const scripts = div.querySelectorAll('script, iframe, object, embed');
  scripts.forEach(el => el.remove());
  
  // Remove event handlers
  const allElements = div.querySelectorAll('*');
  allElements.forEach(el => {
    // Remove inline event handlers
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
    
    // Remove javascript: URLs
    if (el.hasAttribute('href') && el.getAttribute('href').trim().toLowerCase().startsWith('javascript:')) {
      el.removeAttribute('href');
    }
    
    // Remove disallowed tags
    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      el.replaceWith(...el.childNodes);
    } else {
      // Remove disallowed attributes
      const tag = el.tagName.toLowerCase();
      const allowed = allowedAttributes[tag] || [];
      Array.from(el.attributes).forEach(attr => {
        if (!allowed.includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });
    }
  });
  
  return div.innerHTML;
}

/**
 * Validate email
 */
function validateEmail(email) {
  const re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(email) && email.length <= 254;
}

/**
 * Validate phone number (international format)
 */
function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Validate URL
 */
function validateURL(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch (e) {
    return false;
  }
}

/**
 * Sanitize for SQL (basic - server-side should use prepared statements)
 */
function sanitizeSQL(str) {
  return str.replace(/['"\;]/g, '');
}

/**
 * Validate against common injection patterns
 */
function detectInjection(str) {
  const patterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /eval\(/gi,
    /expression\(/gi,
    /vbscript:/gi,
    /SELECT.*FROM/gi,
    /INSERT.*INTO/gi,
    /UPDATE.*SET/gi,
    /DELETE.*FROM/gi,
    /DROP.*TABLE/gi,
    /UNION.*SELECT/gi
  ];
  
  return patterns.some(pattern => pattern.test(str));
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

/**
 * Validate numeric input
 */
function validateNumber(value, min = -Infinity, max = Infinity) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Sanitize user input with configurable rules
 */
function sanitize(input, options = {}) {
  const {
    allowHTML = false,
    maxLength = 10000,
    type = 'text'
  } = options;
  
  if (typeof input !== 'string') {
    input = String(input);
  }
  
  // Trim whitespace
  input = input.trim();
  
  // Check length
  if (input.length > maxLength) {
    input = input.substring(0, maxLength);
  }
  
  // Type-specific validation
  switch (type) {
    case 'email':
      return validateEmail(input) ? input : '';
    
    case 'phone':
      return validatePhone(input) ? input : '';
    
    case 'url':
      return validateURL(input) ? input : '';
    
    case 'number':
      return validateNumber(input) ? input : '';
    
    case 'html':
      return sanitizeHTML(input);
    
    case 'filename':
      return sanitizeFilename(input);
    
    case 'text':
    default:
      return allowHTML ? sanitizeHTML(input) : escapeHTML(input);
  }
}

/**
 * Auto-sanitize form inputs on submit
 */
function protectForms() {
  document.addEventListener('submit', (e) => {
    const form = e.target;
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], textarea');
    
    inputs.forEach(input => {
      const value = input.value;
      
      // Detect potential injection
      if (detectInjection(value)) {
        console.warn('Potential injection detected in input:', input.name);
        e.preventDefault();
        alert('Invalid input detected. Please check your submission.');
        return;
      }
      
      // Auto-sanitize based on input type
      const type = input.getAttribute('type') || input.getAttribute('data-sanitize') || 'text';
      input.value = sanitize(value, { type });
    });
  });
}

/**
 * Initialize input sanitization
 */
export function initInputSanitization() {
  protectForms();
  console.log('🧹 Input sanitization initialized');
}

// Auto-initialize
if (typeof window !== 'undefined' && !window.__SANITIZER_INITIALIZED__) {
  window.__SANITIZER_INITIALIZED__ = true;
  
  if (document.readyState === 'complete') {
    initInputSanitization();
  } else {
    window.addEventListener('load', initInputSanitization);
  }
}

// Export utilities
window.InputSanitizer = {
  sanitize,
  escapeHTML,
  stripTags,
  sanitizeHTML,
  validateEmail,
  validatePhone,
  validateURL,
  validateNumber,
  detectInjection,
  sanitizeFilename
};

export {
  sanitize,
  escapeHTML,
  stripTags,
  sanitizeHTML,
  validateEmail,
  validatePhone,
  validateURL,
  validateNumber,
  detectInjection,
  sanitizeFilename
};
