// metrics.js
// Basic Application Performance Monitoring for La Tanda Platform

// In-memory metrics storage (for simple deployments)
// For production scaling, consider Redis or a proper time-series database
const metrics = {
    startTime: Date.now(),
    requests: {
        total: 0,
        success: 0,
        errors: 0,
        by_endpoint: {},
        by_method: { GET: 0, POST: 0, PUT: 0, DELETE: 0, OPTIONS: 0 }
    },
    response_times: {
        sum: 0,
        count: 0,
        min: Infinity,
        max: 0,
        p95_samples: [] // Rolling window for P95 calculation
    },
    errors: {
        by_status: {},
        recent: [] // Last 100 errors
    },
    rate_limits: {
        triggered: 0,
        by_ip: {}
    }
};

const MAX_P95_SAMPLES = 1000;
const MAX_RECENT_ERRORS = 100;

// Track request start
function startRequest(req) {
    req._metricsStart = Date.now();
    metrics.requests.total++;
    
    const method = req.method || "GET";
    metrics.requests.by_method[method] = (metrics.requests.by_method[method] || 0) + 1;
    
    const endpoint = extractEndpointPattern(req.url);
    metrics.requests.by_endpoint[endpoint] = (metrics.requests.by_endpoint[endpoint] || 0) + 1;
}

// Track request end
function endRequest(req, res) {
    if (!req._metricsStart) return;
    
    const duration = Date.now() - req._metricsStart;
    const statusCode = res.statusCode || 200;
    
    // Track response time
    metrics.response_times.sum += duration;
    metrics.response_times.count++;
    metrics.response_times.min = Math.min(metrics.response_times.min, duration);
    metrics.response_times.max = Math.max(metrics.response_times.max, duration);
    
    // Add to P95 samples (rolling window)
    metrics.response_times.p95_samples.push(duration);
    if (metrics.response_times.p95_samples.length > MAX_P95_SAMPLES) {
        metrics.response_times.p95_samples.shift();
    }
    
    // Track success/error
    if (statusCode >= 200 && statusCode < 400) {
        metrics.requests.success++;
    } else {
        metrics.requests.errors++;
        metrics.errors.by_status[statusCode] = (metrics.errors.by_status[statusCode] || 0) + 1;
        
        // Track recent errors
        metrics.errors.recent.push({
            timestamp: new Date().toISOString(),
            status: statusCode,
            endpoint: extractEndpointPattern(req.url),
            method: req.method
        });
        if (metrics.errors.recent.length > MAX_RECENT_ERRORS) {
            metrics.errors.recent.shift();
        }
    }
}

// Track rate limit
function trackRateLimit(ip) {
    metrics.rate_limits.triggered++;
    metrics.rate_limits.by_ip[ip] = (metrics.rate_limits.by_ip[ip] || 0) + 1;
}

// Extract endpoint pattern (remove IDs for grouping)
function extractEndpointPattern(url) {
    if (!url) return "/unknown";
    const path = url.split("?")[0];
    // Replace UUIDs and numeric IDs with :id
    return path
        .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:id")
        .replace(/\/\d+/g, "/:id");
}

// Calculate P95
function calculateP95() {
    const samples = [...metrics.response_times.p95_samples].sort((a, b) => a - b);
    if (samples.length === 0) return 0;
    const idx = Math.floor(samples.length * 0.95);
    return samples[idx] || 0;
}

// Get metrics summary
function getMetrics() {
    const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
    const avgResponseTime = metrics.response_times.count > 0 
        ? Math.round(metrics.response_times.sum / metrics.response_times.count) 
        : 0;
    
    return {
        uptime_seconds: uptime,
        requests: {
            total: metrics.requests.total,
            success: metrics.requests.success,
            errors: metrics.requests.errors,
            success_rate: metrics.requests.total > 0 
                ? ((metrics.requests.success / metrics.requests.total) * 100).toFixed(2) + "%" 
                : "0%",
            by_method: metrics.requests.by_method,
            top_endpoints: Object.entries(metrics.requests.by_endpoint)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {})
        },
        response_times: {
            average_ms: avgResponseTime,
            min_ms: metrics.response_times.min === Infinity ? 0 : metrics.response_times.min,
            max_ms: metrics.response_times.max,
            p95_ms: calculateP95()
        },
        errors: {
            by_status: metrics.errors.by_status,
            recent: metrics.errors.recent.slice(-10) // Last 10 errors
        },
        rate_limits: {
            total_triggered: metrics.rate_limits.triggered,
            top_ips: Object.entries(metrics.rate_limits.by_ip)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {})
        }
    };
}

// Reset metrics (for testing)
function resetMetrics() {
    metrics.requests = { total: 0, success: 0, errors: 0, by_endpoint: {}, by_method: { GET: 0, POST: 0, PUT: 0, DELETE: 0, OPTIONS: 0 } };
    metrics.response_times = { sum: 0, count: 0, min: Infinity, max: 0, p95_samples: [] };
    metrics.errors = { by_status: {}, recent: [] };
    metrics.rate_limits = { triggered: 0, by_ip: {} };
}

module.exports = {
    startRequest,
    endRequest,
    trackRateLimit,
    getMetrics,
    resetMetrics
};
