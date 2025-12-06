/**
 * Simple In-Memory Cache Service
 * Caches frequently accessed data to reduce database load
 * Works with single server - for distributed caching use Redis
 */

// Cache storage
const cache = new Map();

/**
 * Cache configuration (in milliseconds)
 */
const CACHE_DURATIONS = {
  // Analytics - cache for 10 minutes (frequently accessed, not critical to be real-time)
  analytics_overview: 10 * 60 * 1000,
  
  // Post history - cache for 5 minutes (changes frequently)
  post_history: 5 * 60 * 1000,
  
  // Platform stats - cache for 15 minutes (less frequently updated)
  platform_stats: 15 * 60 * 1000,
  
  // User accounts - cache for 30 minutes (rarely changes)
  user_accounts: 30 * 60 * 1000,
  
  // Billing info - cache for 30 minutes (rarely changes)
  billing_info: 30 * 60 * 1000,
  
  // Team data - cache for 20 minutes
  team_data: 20 * 60 * 1000,
  
  // Hashtag performance - cache for 1 hour
  hashtag_performance: 60 * 60 * 1000,
  
  // Best posting times - cache for 1 hour (historical data)
  best_posting_times: 60 * 60 * 1000,
};

/**
 * Set a value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} duration - How long to cache (ms). Uses default if not specified
 */
function set(key, value, duration) {
  const cacheDuration = duration || CACHE_DURATIONS[key] || 10 * 60 * 1000; // Default 10 min
  
  cache.set(key, {
    value,
    expiresAt: Date.now() + cacheDuration,
    createdAt: Date.now()
  });
  
  console.log(`💾 Cached: ${key} (expires in ${Math.round(cacheDuration / 1000)}s)`);
}

/**
 * Get a value from cache
 * @param {string} key - Cache key
 * @returns {*} Cached value or null if expired/not found
 */
function get(key) {
  const cached = cache.get(key);
  
  if (!cached) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    console.log(`⏱️  Cache expired: ${key}`);
    return null;
  }
  
  // Return cached value
  const ageSeconds = Math.round((Date.now() - cached.createdAt) / 1000);
  console.log(`⚡ Cache hit: ${key} (age: ${ageSeconds}s)`);
  return cached.value;
}

/**
 * Clear a specific cache key
 * @param {string} key - Cache key
 */
function invalidate(key) {
  if (cache.has(key)) {
    cache.delete(key);
    console.log(`🗑️  Invalidated cache: ${key}`);
  }
}

/**
 * Clear all cache for a user (when they make changes)
 * @param {string} userId - User ID
 */
function invalidateUserCache(userId) {
  const keysToDelete = [];
  
  cache.forEach((value, key) => {
    if (key.includes(userId)) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => {
    cache.delete(key);
    console.log(`🗑️  Invalidated: ${key}`);
  });
  
  if (keysToDelete.length > 0) {
    console.log(`🗑️  Cleared ${keysToDelete.length} cache entries for user ${userId}`);
  }
}

/**
 * Clear specific cache categories for a user
 * @param {string} userId - User ID
 * @param {string[]} categories - Cache categories to clear (e.g., ['analytics', 'posts'])
 */
function invalidateUserCacheByCategory(userId, categories = []) {
  const keysToDelete = [];
  
  cache.forEach((value, key) => {
    if (key.includes(userId)) {
      // If no categories specified, delete all
      if (categories.length === 0) {
        keysToDelete.push(key);
      } else {
        // Delete only matching categories
        if (categories.some(cat => key.includes(cat))) {
          keysToDelete.push(key);
        }
      }
    }
  });
  
  keysToDelete.forEach(key => {
    cache.delete(key);
  });
  
  if (keysToDelete.length > 0) {
    console.log(`🗑️  Cleared ${keysToDelete.length} ${categories.join('/')} cache entries for user ${userId}`);
  }
}

/**
 * Get cache statistics (for monitoring)
 * @returns {object} Cache stats
 */
function getStats() {
  let totalSize = 0;
  let validEntries = 0;
  let expiredEntries = 0;
  
  cache.forEach((value, key) => {
    if (Date.now() > value.expiresAt) {
      expiredEntries++;
    } else {
      validEntries++;
    }
    totalSize += JSON.stringify(value).length;
  });
  
  return {
    totalEntries: cache.size,
    validEntries,
    expiredEntries,
    totalSizeKB: Math.round(totalSize / 1024),
    entries: Array.from(cache.entries()).map(([key, value]) => ({
      key,
      expiresIn: Math.round((value.expiresAt - Date.now()) / 1000) + 's',
      ageSeconds: Math.round((Date.now() - value.createdAt) / 1000)
    }))
  };
}

/**
 * Cleanup expired entries (run periodically)
 */
function cleanup() {
  let deletedCount = 0;
  
  cache.forEach((value, key) => {
    if (Date.now() > value.expiresAt) {
      cache.delete(key);
      deletedCount++;
    }
  });
  
  if (deletedCount > 0) {
    console.log(`🧹 Cleaned up ${deletedCount} expired cache entries`);
  }
  
  return deletedCount;
}

/**
 * Clear all cache
 */
function clear() {
  const count = cache.size;
  cache.clear();
  console.log(`🗑️  Cleared all ${count} cache entries`);
}

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

module.exports = {
  set,
  get,
  invalidate,
  invalidateUserCache,
  invalidateUserCacheByCategory,
  getStats,
  cleanup,
  clear,
  CACHE_DURATIONS
};

