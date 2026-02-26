/**
 * Advanced Cache Strategy
 * Intelligent caching with versioning, TTL, and cache invalidation
 */

const CACHE_VERSION = 'v1';
const CACHE_PREFIX = 'latanda';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

// Cache configurations by resource type
const CACHE_CONFIGS = {
  api: {
    ttl: 5 * 60 * 1000,      // 5 minutes
    strategy: 'network-first',
    maxAge: 100,
    maxSize: 10 * 1024 * 1024  // 10MB
  },
  static: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    strategy: 'cache-first',
    maxAge: 1000,
    maxSize: 50 * 1024 * 1024  // 50MB
  },
  dynamic: {
    ttl: 30 * 60 * 1000,      // 30 minutes
    strategy: 'stale-while-revalidate',
    maxAge: 50,
    maxSize: 5 * 1024 * 1024   // 5MB
  },
  images: {
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    strategy: 'cache-first',
    maxAge: 500,
    maxSize: 100 * 1024 * 1024  // 100MB
  }
};

/**
 * Get cache configuration for URL
 */
function getCacheConfig(url) {
  if (url.includes('/api/')) return CACHE_CONFIGS.api;
  if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return CACHE_CONFIGS.images;
  if (url.match(/\.(js|css)$/i)) return CACHE_CONFIGS.static;
  return CACHE_CONFIGS.dynamic;
}

/**
 * Generate cache key with version
 */
function getCacheKey(url, config) {
  return `${CACHE_PREFIX}-${CACHE_VERSION}-${config.strategy}-${url}`;
}

/**
 * Get cache metadata
 */
function getCacheMetadata(key) {
  const stored = localStorage.getItem(`${key}:meta`);
  if (\!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
}

/**
 * Set cache metadata
 */
function setCacheMetadata(key, metadata) {
  try {
    localStorage.setItem(`${key}:meta`, JSON.stringify(metadata));
  } catch (e) {
    console.warn('Failed to set cache metadata', e);
  }
}

/**
 * Check if cache entry is expired
 */
function isCacheExpired(metadata, ttl) {
  if (\!metadata || \!metadata.timestamp) return true;
  return Date.now() - metadata.timestamp > ttl;
}

/**
 * Get from cache with TTL check
 */
async function getFromCache(url) {
  const config = getCacheConfig(url);
  const cacheKey = getCacheKey(url, config);
  const metadata = getCacheMetadata(cacheKey);
  
  // Check if expired
  if (isCacheExpired(metadata, config.ttl)) {
    return null;
  }
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (\!cached) return null;
    
    return JSON.parse(cached);
  } catch (e) {
    console.warn('Failed to get from cache', e);
    return null;
  }
}

/**
 * Save to cache with metadata
 */
function saveToCache(url, data) {
  const config = getCacheConfig(url);
  const cacheKey = getCacheKey(url, config);
  
  try {
    // Save data
    localStorage.setItem(cacheKey, JSON.stringify(data));
    
    // Save metadata
    setCacheMetadata(cacheKey, {
      timestamp: Date.now(),
      size: JSON.stringify(data).length,
      url: url
    });
    
    // Clean old entries if needed
    cleanOldCacheEntries(config);
  } catch (e) {
    console.warn('Failed to save to cache', e);
    // Quota exceeded - clean and retry
    cleanOldCacheEntries(config);
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      setCacheMetadata(cacheKey, {
        timestamp: Date.now(),
        size: JSON.stringify(data).length,
        url: url
      });
    } catch (e2) {
      console.error('Cache save failed after cleanup', e2);
    }
  }
}

/**
 * Clean old cache entries
 */
function cleanOldCacheEntries(config) {
  const keys = Object.keys(localStorage);
  const cacheKeys = keys.filter(k => k.startsWith(`${CACHE_PREFIX}-${CACHE_VERSION}`));
  
  // Get all metadata
  const entries = cacheKeys
    .filter(k => \!k.endsWith(':meta'))
    .map(k => ({
      key: k,
      metadata: getCacheMetadata(k)
    }))
    .filter(e => e.metadata);
  
  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.metadata.timestamp - b.metadata.timestamp);
  
  // Remove oldest entries if over maxAge
  if (entries.length > config.maxAge) {
    const toRemove = entries.slice(0, entries.length - config.maxAge);
    toRemove.forEach(entry => {
      localStorage.removeItem(entry.key);
      localStorage.removeItem(`${entry.key}:meta`);
    });
  }
}

/**
 * Cache-first strategy
 */
async function cacheFirst(url, fetchOptions = {}) {
  // Try cache first
  const cached = await getFromCache(url);
  if (cached \!== null) {
    return cached;
  }
  
  // Fetch from network
  const response = await fetch(url, fetchOptions);
  const data = await response.json();
  
  // Save to cache
  saveToCache(url, data);
  
  return data;
}

/**
 * Network-first strategy
 */
async function networkFirst(url, fetchOptions = {}) {
  try {
    // Try network first
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    
    // Save to cache
    saveToCache(url, data);
    
    return data;
  } catch (e) {
    // Fall back to cache
    const cached = await getFromCache(url);
    if (cached \!== null) {
      return cached;
    }
    throw e;
  }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(url, fetchOptions = {}) {
  // Return cached immediately
  const cached = await getFromCache(url);
  
  // Fetch fresh data in background
  fetch(url, fetchOptions)
    .then(r => r.json())
    .then(data => saveToCache(url, data))
    .catch(e => console.warn('Background fetch failed', e));
  
  // Return cached or fetch if not cached
  if (cached \!== null) {
    return cached;
  }
  
  const response = await fetch(url, fetchOptions);
  const data = await response.json();
  saveToCache(url, data);
  return data;
}

/**
 * Smart fetch with caching strategy
 */
export async function smartFetch(url, options = {}) {
  const config = getCacheConfig(url);
  
  switch (config.strategy) {
    case 'cache-first':
      return cacheFirst(url, options);
    
    case 'network-first':
      return networkFirst(url, options);
    
    case 'stale-while-revalidate':
      return staleWhileRevalidate(url, options);
    
    default:
      return networkFirst(url, options);
  }
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  const keys = Object.keys(localStorage);
  const cacheKeys = keys.filter(k => k.startsWith(`${CACHE_PREFIX}-`));
  cacheKeys.forEach(k => localStorage.removeItem(k));
  console.log(`🗑️ Cleared ${cacheKeys.length} cache entries`);
}

/**
 * Clear old cache versions
 */
export function clearOldCacheVersions() {
  const keys = Object.keys(localStorage);
  const oldKeys = keys.filter(k => k.startsWith(CACHE_PREFIX) && \!k.startsWith(`${CACHE_PREFIX}-${CACHE_VERSION}`));
  oldKeys.forEach(k => localStorage.removeItem(k));
  console.log(`🗑️ Cleared ${oldKeys.length} old cache version entries`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const keys = Object.keys(localStorage);
  const cacheKeys = keys.filter(k => k.startsWith(`${CACHE_PREFIX}-${CACHE_VERSION}`) && \!k.endsWith(':meta'));
  
  let totalSize = 0;
  const stats = {
    totalEntries: cacheKeys.length,
    byStrategy: {},
    totalSize: 0
  };
  
  cacheKeys.forEach(key => {
    const metadata = getCacheMetadata(key);
    if (metadata) {
      totalSize += metadata.size || 0;
      
      const strategy = key.split('-')[2];
      stats.byStrategy[strategy] = (stats.byStrategy[strategy] || 0) + 1;
    }
  });
  
  stats.totalSize = totalSize;
  stats.totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  return stats;
}

// Export for global use
window.AdvancedCache = {
  fetch: smartFetch,
  clear: clearAllCache,
  clearOld: clearOldCacheVersions,
  stats: getCacheStats
};

console.log('💾 Advanced caching strategy initialized');
