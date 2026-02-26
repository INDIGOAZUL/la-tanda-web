/**
 * Error Tracking System
 * Comprehensive error monitoring with stack traces and context
 */

// Configuration
const ERROR_ENDPOINT = /api/analytics/errors;
const MAX_STACK_LENGTH = 500;
const BATCH_SIZE = 3;
const BATCH_TIMEOUT = 10000; // 10 seconds

// Error queue for batching
let errorQueue = [];
let batchTimer = null;

/**
 * Get browser and environment context
 */
function getContext() {
  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth
    },
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    cookiesEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    memory: navigator.deviceMemory || unknown,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    } : null
  };
}

/**
 * Parse error stack trace
 */
function parseStackTrace(error) {
  if (\!error.stack) return null;
  
  const stack = error.stack.substring(0, MAX_STACK_LENGTH);
  const lines = stack.split(n).slice(0, 10); // First 10 stack frames
  
  return lines.map(line => {
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      return {
        function: match[1],
        file: match[2],
        line: parseInt(match[3]),
        column: parseInt(match[4])
      };
    }
    return { raw: line.trim() };
  });
}

/**
 * Send errors to backend
 */
function sendErrors(errors) {
  if (errors.length === 0) return;

  const payload = {
    errors,
    sessionId: getSessionId(),
    userId: getUserId()
  };

  // Send to backend
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: application/json });
    navigator.sendBeacon(ERROR_ENDPOINT, blob);
  } else {
    fetch(ERROR_ENDPOINT, {
      method: POST,
      headers: { Content-Type: application/json },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(err => console.warn(Failed to send error report:, err));
  }

  // Log to console in development
  if (window.location.hostname === localhost || window.location.hostname === 127.0.0.1) {
    console.group(🔴 Error Report Sent);
    errors.forEach(error => {
      console.error(error.message, error);
    });
    console.groupEnd();
  }
}

/**
 * Get or create session ID
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem(error_tracking_session);
  if (\!sessionId) {
    sessionId = session_ + Date.now() + _ + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem(error_tracking_session, sessionId);
  }
  return sessionId;
}

/**
 * Get user ID if available
 */
function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem(user) || {});
    return user.id || user.email || anonymous;
  } catch (e) {
    return anonymous;
  }
}

/**
 * Track an error
 */
function trackError(error, errorInfo = {}) {
  const errorData = {
    type: errorInfo.type || javascript,
    severity: errorInfo.severity || error,
    message: error.message || Unknown error,
    name: error.name || Error,
    stack: parseStackTrace(error),
    context: getContext(),
    additionalInfo: errorInfo,
    timestamp: Date.now()
  };

  errorQueue.push(errorData);

  // Flush if batch is full or error is critical
  if (errorQueue.length >= BATCH_SIZE || errorInfo.severity === critical) {
    clearTimeout(batchTimer);
    sendErrors([...errorQueue]);
    errorQueue = [];
  } else {
    // Schedule batch flush
    clearTimeout(batchTimer);
    batchTimer = setTimeout(() => {
      if (errorQueue.length > 0) {
        sendErrors([...errorQueue]);
        errorQueue = [];
      }
    }, BATCH_TIMEOUT);
  }
}

/**
 * Global error handler
 */
window.addEventListener(error, (event) => {
  trackError(event.error || new Error(event.message), {
    type: uncaught_error,
    severity: error,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener(unhandledrejection, (event) => {
  const error = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason));
  
  trackError(error, {
    type: unhandled_rejection,
    severity: warning,
    promise: event.promise
  });
});

/**
 * Network error tracking
 */
const originalFetch = window.fetch;
window.fetch = function(...args) {
  return originalFetch.apply(this, args)
    .then(response => {
      if (\!response.ok) {
        trackError(new Error(`HTTP ${response.status}: ${response.statusText}`), {
          type: network_error,
          severity: response.status >= 500 ? error : warning,
          url: args[0],
          status: response.status,
          statusText: response.statusText
        });
      }
      return response;
    })
    .catch(error => {
      trackError(error, {
        type: network_error,
        severity: error,
        url: args[0]
      });
      throw error;
    });
};

/**
 * Flush errors before page unload
 */
window.addEventListener(visibilitychange, () => {
  if (document.visibilityState === hidden && errorQueue.length > 0) {
    sendErrors([...errorQueue]);
    errorQueue = [];
  }
});

// Export for manual error tracking
window.ErrorTracker = {
  track: trackError,
  flush: () => {
    if (errorQueue.length > 0) {
      sendErrors([...errorQueue]);
      errorQueue = [];
    }
  }
};

console.log(🔴 Error tracking initialized);
