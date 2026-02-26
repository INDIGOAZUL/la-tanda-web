/**
 * CSRF Protection Module
 * Implements CSRF token generation and validation
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate a secure random token
 */
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join(');
}

/**
 * Get or create CSRF token
 */
function getCSRFToken() {
  try {
    const stored = sessionStorage.getItem(CSRF_TOKEN_KEY);
    if (stored) {
      const { token, timestamp } = JSON.parse(stored);
      const age = Date.now() - timestamp;
      
      // Return existing token if not expired
      if (age < TOKEN_EXPIRY) {
        return token;
      }
    }
  } catch (e) {
    console.warn('Failed to retrieve CSRF token', e);
  }
  
  // Generate new token
  const newToken = generateToken();
  const tokenData = {
    token: newToken,
    timestamp: Date.now()
  };
  
  try {
    sessionStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(tokenData));
  } catch (e) {
    console.warn('Failed to store CSRF token', e);
  }
  
  return newToken;
}

/**
 * Add CSRF token to fetch requests
 */
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  // Only add token to same-origin requests
  const isSameOrigin = url.startsWith('/') || url.startsWith(window.location.origin);
  
  // Only add token to state-changing methods
  const method = (options.method || 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  if (isSameOrigin && isStateChanging) {
    const token = getCSRFToken();
    options.headers = options.headers || {};
    
    if (options.headers instanceof Headers) {
      options.headers.set(CSRF_HEADER_NAME, token);
    } else {
      options.headers[CSRF_HEADER_NAME] = token;
    }
  }
  
  return originalFetch.call(this, url, options);
};

/**
 * Add CSRF token to forms
 */
function protectForms() {
  document.addEventListener('submit', (e) => {
    const form = e.target;
    
    // Only protect forms submitting to same origin
    const action = form.action || window.location.href;
    const isSameOrigin = action.startsWith(window.location.origin) || !action.includes('://');
    
    if (isSameOrigin && form.method.toUpperCase() === 'POST') {
      // Check if token field already exists
      let tokenField = form.querySelector('input[name="_csrf"]');
      
      if (!tokenField) {
        tokenField = document.createElement('input');
        tokenField.type = 'hidden';
        tokenField.name = '_csrf';
        form.appendChild(tokenField);
      }
      
      tokenField.value = getCSRFToken();
    }
  });
}

/**
 * Add CSRF meta tag for SPA frameworks
 */
function addMetaTag() {
  let metaTag = document.querySelector('meta[name="csrf-token"]');
  
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.name = 'csrf-token';
    document.head.appendChild(metaTag);
  }
  
  metaTag.content = getCSRFToken();
}

/**
 * Initialize CSRF protection
 */
export function initCSRFProtection() {
  // Generate initial token
  getCSRFToken();
  
  // Add meta tag
  addMetaTag();
  
  // Protect forms
  protectForms();
  
  // Refresh token periodically (every 30 minutes)
  setInterval(() => {
    const newToken = generateToken();
    const tokenData = {
      token: newToken,
      timestamp: Date.now()
    };
    sessionStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(tokenData));
    addMetaTag();
  }, 30 * 60 * 1000);
  
  console.log('🔒 CSRF protection initialized');
}

// Auto-initialize
if (typeof window !== 'undefined' && !window.__CSRF_INITIALIZED__) {
  window.__CSRF_INITIALIZED__ = true;
  
  if (document.readyState === 'complete') {
    initCSRFProtection();
  } else {
    window.addEventListener('load', initCSRFProtection);
  }
}

// Export for manual use
window.CSRFProtection = {
  getToken: getCSRFToken,
  init: initCSRFProtection
};
