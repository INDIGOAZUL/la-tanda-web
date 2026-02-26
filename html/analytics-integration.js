/**
 * Analytics Integration Module
 * Unified analytics tracking for La Tanda platform
 */

// Configuration
const ANALYTICS_ENDPOINT = '/api/analytics/events';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const HEARTBEAT_INTERVAL = 60 * 1000; // 1 minute

// Session management
let sessionData = {
  id: null,
  startTime: null,
  lastActivity: null,
  pageViews: 0,
  events: []
};

/**
 * Initialize analytics session
 */
function initSession() {
  // Check for existing session
  const stored = sessionStorage.getItem('analytics_session');
  if (stored) {
    try {
      sessionData = JSON.parse(stored);
      const timeSinceActivity = Date.now() - sessionData.lastActivity;
      
      if (timeSinceActivity < SESSION_TIMEOUT) {
        // Continue existing session
        sessionData.lastActivity = Date.now();
        sessionData.pageViews++;
        saveSession();
        return;
      }
    } catch (e) {
      console.warn('Failed to restore session', e);
    }
  }
  
  // Create new session
  sessionData = {
    id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    startTime: Date.now(),
    lastActivity: Date.now(),
    pageViews: 1,
    events: []
  };
  
  saveSession();
  
  // Track session start
  trackEvent('session_start', {
    referrer: document.referrer,
    landingPage: window.location.href
  });
}

/**
 * Save session to sessionStorage
 */
function saveSession() {
  try {
    sessionStorage.setItem('analytics_session', JSON.stringify(sessionData));
  } catch (e) {
    console.warn('Failed to save session', e);
  }
}

/**
 * Get user information
 */
function getUserInfo() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      id: user.id || null,
      email: user.email || null,
      role: user.role || 'guest'
    };
  } catch (e) {
    return { id: null, email: null, role: 'guest' };
  }
}

/**
 * Track an event
 */
function trackEvent(eventName, eventData = {}) {
  const event = {
    name: eventName,
    data: eventData,
    timestamp: Date.now(),
    sessionId: sessionData.id,
    user: getUserInfo(),
    page: {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer
    },
    device: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height
      }
    }
  };
  
  // Add to session events
  sessionData.events.push({
    name: eventName,
    timestamp: event.timestamp
  });
  sessionData.lastActivity = Date.now();
  saveSession();
  
  // Send to backend
  sendToBackend([event]);
  
  // Log in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('📊 Analytics Event:', eventName, eventData);
  }
}

/**
 * Send events to backend
 */
function sendToBackend(events) {
  if (events.length === 0) return;
  
  const payload = { events };
  
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
  } else {
    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(err => console.warn('Failed to send analytics:', err));
  }
}

/**
 * Track page view
 */
function trackPageView() {
  trackEvent('page_view', {
    pageLoadTime: performance.timing ? 
      (performance.timing.loadEventEnd - performance.timing.navigationStart) : null
  });
}

/**
 * Track clicks
 */
function setupClickTracking() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a, button, [data-track]');
    if (!target) return;
    
    const trackData = {
      element: target.tagName.toLowerCase(),
      text: target.textContent?.trim().substring(0, 50),
      href: target.href || null,
      id: target.id || null,
      class: target.className || null
    };
    
    // Get custom tracking attributes
    if (target.dataset.track) {
      trackData.trackingId = target.dataset.track;
    }
    if (target.dataset.trackCategory) {
      trackData.category = target.dataset.trackCategory;
    }
    
    trackEvent('click', trackData);
  }, { passive: true });
}

/**
 * Track scroll depth
 */
function setupScrollTracking() {
  let maxScroll = 0;
  const thresholds = [25, 50, 75, 90, 100];
  const reached = new Set();
  
  const checkScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / scrollHeight) * 100;
    
    if (scrolled > maxScroll) {
      maxScroll = scrolled;
      
      thresholds.forEach(threshold => {
        if (scrolled >= threshold && !reached.has(threshold)) {
          reached.add(threshold);
          trackEvent('scroll_depth', { depth: threshold });
        }
      });
    }
  };
  
  window.addEventListener('scroll', checkScroll, { passive: true });
}

/**
 * Track time on page
 */
function setupTimeTracking() {
  let startTime = Date.now();
  let isActive = true;
  
  // Track visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      isActive = false;
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackEvent('time_on_page', { seconds: timeSpent });
    } else {
      isActive = true;
      startTime = Date.now();
    }
  });
  
  // Track before unload
  window.addEventListener('beforeunload', () => {
    if (isActive) {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackEvent('time_on_page', { seconds: timeSpent });
    }
  });
}

/**
 * Send heartbeat to keep session alive
 */
function setupHeartbeat() {
  setInterval(() => {
    const timeSinceActivity = Date.now() - sessionData.lastActivity;
    
    if (timeSinceActivity < SESSION_TIMEOUT) {
      trackEvent('heartbeat', {
        sessionDuration: Date.now() - sessionData.startTime,
        pageViewsInSession: sessionData.pageViews,
        eventsInSession: sessionData.events.length
      });
    }
  }, HEARTBEAT_INTERVAL);
}

/**
 * Track form submissions
 */
function setupFormTracking() {
  document.addEventListener('submit', (e) => {
    const form = e.target;
    trackEvent('form_submit', {
      formId: form.id || null,
      formAction: form.action || null,
      formMethod: form.method || 'GET'
    });
  });
}

/**
 * Initialize analytics
 */
export function initAnalytics() {
  initSession();
  trackPageView();
  setupClickTracking();
  setupScrollTracking();
  setupTimeTracking();
  setupFormTracking();
  setupHeartbeat();
  
  console.log('📊 Analytics integration initialized');
}

/**
 * Export tracking function for manual use
 */
export { trackEvent };

// Auto-initialize
if (typeof window !== 'undefined' && !window.__ANALYTICS_INITIALIZED__) {
  window.__ANALYTICS_INITIALIZED__ = true;
  
  if (document.readyState === 'complete') {
    initAnalytics();
  } else {
    window.addEventListener('load', initAnalytics);
  }
}
