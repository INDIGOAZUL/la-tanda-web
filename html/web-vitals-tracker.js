/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and sends to analytics endpoint
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

// Configuration
const ANALYTICS_ENDPOINT = '/api/analytics/web-vitals';
const BATCH_SIZE = 5;
const BATCH_TIMEOUT = 5000; // 5 seconds

// Batch collection
let metricsQueue = [];
let batchTimer = null;

/**
 * Send metrics to analytics endpoint
 */
function sendMetrics(metrics) {
  if (metrics.length === 0) return;

  // Send to backend analytics
  if (navigator.sendBeacon) {
    // Use sendBeacon for reliable delivery (even on page unload)
    const blob = new Blob([JSON.stringify({ metrics })], { type: 'application/json' });
    navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
  } else {
    // Fallback to fetch
    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics }),
      keepalive: true
    }).catch(err => console.warn('Failed to send metrics:', err));
  }

  // Log to console in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('📊 Web Vitals:', metrics);
  }
}

/**
 * Add metric to batch and flush if needed
 */
function collectMetric(metric) {
  const data = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : null
  };

  metricsQueue.push(data);

  // Flush if batch is full
  if (metricsQueue.length >= BATCH_SIZE) {
    clearTimeout(batchTimer);
    sendMetrics([...metricsQueue]);
    metricsQueue = [];
  } else {
    // Schedule batch flush
    clearTimeout(batchTimer);
    batchTimer = setTimeout(() => {
      if (metricsQueue.length > 0) {
        sendMetrics([...metricsQueue]);
        metricsQueue = [];
      }
    }, BATCH_TIMEOUT);
  }
}

/**
 * Get performance rating with color
 */
function getRatingInfo(name, value) {
  const thresholds = {
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FID: { good: 100, needsImprovement: 300 },
    LCP: { good: 2500, needsImprovement: 4000 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 },
    INP: { good: 200, needsImprovement: 500 }
  };

  const threshold = thresholds[name];
  if (!threshold) return { rating: 'unknown', color: 'gray' };

  if (value <= threshold.good) {
    return { rating: 'good', color: 'green', emoji: '✅' };
  } else if (value <= threshold.needsImprovement) {
    return { rating: 'needs-improvement', color: 'orange', emoji: '⚠️' };
  } else {
    return { rating: 'poor', color: 'red', emoji: '❌' };
  }
}

/**
 * Display Web Vitals overlay (for testing)
 */
function displayVitalsOverlay(metrics) {
  // Only in development or when ?debug=vitals is in URL
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has('debug') || urlParams.get('debug') !== 'vitals') return;

  let overlay = document.getElementById('web-vitals-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'web-vitals-overlay';
    overlay.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 999999;
      min-width: 250px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(overlay);
  }

  const html = metrics.map(m => {
    const info = getRatingInfo(m.name, m.value);
    return `<div style="margin: 5px 0; color: ${info.color}">
      ${info.emoji} <strong>${m.name}:</strong> ${Math.round(m.value)}${m.name === 'CLS' ? '' : 'ms'}
      <span style="opacity: 0.7">(${info.rating})</span>
    </div>`;
  }).join('');

  overlay.innerHTML = `<div style="font-weight: bold; margin-bottom: 10px;">📊 Web Vitals</div>${html}`;
}

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitals() {
  // Track all Core Web Vitals
  const allMetrics = [];

  onCLS((metric) => {
    collectMetric(metric);
    allMetrics.push(metric);
    displayVitalsOverlay(allMetrics);
  });

  onFID((metric) => {
    collectMetric(metric);
    allMetrics.push(metric);
    displayVitalsOverlay(allMetrics);
  });

  onFCP((metric) => {
    collectMetric(metric);
    allMetrics.push(metric);
    displayVitalsOverlay(allMetrics);
  });

  onLCP((metric) => {
    collectMetric(metric);
    allMetrics.push(metric);
    displayVitalsOverlay(allMetrics);
  });

  onTTFB((metric) => {
    collectMetric(metric);
    allMetrics.push(metric);
    displayVitalsOverlay(allMetrics);
  });

  // INP (Interaction to Next Paint) - replaces FID
  onINP((metric) => {
    collectMetric(metric);
    allMetrics.push(metric);
    displayVitalsOverlay(allMetrics);
  });

  // Flush any remaining metrics before page unload
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && metricsQueue.length > 0) {
      sendMetrics([...metricsQueue]);
      metricsQueue = [];
    }
  });

  console.log('📊 Web Vitals monitoring initialized');
}

// Auto-initialize if not in module context
if (typeof window !== 'undefined' && !window.__WEB_VITALS_INITIALIZED__) {
  window.__WEB_VITALS_INITIALIZED__ = true;

  // Wait for page to be interactive
  if (document.readyState === 'complete') {
    initWebVitals();
  } else {
    window.addEventListener('load', initWebVitals);
  }
}
