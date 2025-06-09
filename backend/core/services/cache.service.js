/**
 * Cache Service
 * Handles caching operations to reduce database reads
 */

const NodeCache = require("node-cache");

class CacheService {
  constructor() {
    // Initialize in-memory cache
    this.cache = new NodeCache({
      stdTTL: 300, // Default 5 minutes
      checkperiod: 60, // Check for expired keys every minute
      useClones: false,
    });

    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
    };
  }

  async get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      return value;
    }
    this.stats.misses++;
    return null;
  }

  async set(key, value, ttl = null) {
    this.stats.sets++;
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  async del(key) {
    return this.cache.del(key);
  }

  async invalidatePattern(pattern) {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern.replace("*", ".*"));

    const keysToDelete = keys.filter((key) => regex.test(key));
    if (keysToDelete.length > 0) {
      this.cache.del(keysToDelete);
    }

    return keysToDelete.length;
  }

  async flush() {
    this.cache.flushAll();
  }

  getStats() {
    return {
      ...this.stats,
      keys: this.cache.keys().length,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }
}

module.exports = new CacheService();
