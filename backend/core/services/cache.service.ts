import NodeCache from "node-cache";

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  keys: number;
  hitRate: number;
}

class CacheService {
  private cache: NodeCache;
  private stats: { hits: number; misses: number; sets: number };

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300,
      checkperiod: 60,
      useClones: false,
    });
    this.stats = { hits: 0, misses: 0, sets: 0 };
  }

  async get<T = any>(key: string): Promise<T | null> {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      this.stats.hits++;
      return value;
    }
    this.stats.misses++;
    return null;
  }

  async set<T = any>(
    key: string,
    value: T,
    ttl: number | null = null
  ): Promise<boolean> {
    this.stats.sets++;
    return ttl ? this.cache.set(key, value, ttl) : this.cache.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.cache.del(key);
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    const keysToDelete = keys.filter((key) => regex.test(key));
    if (keysToDelete.length) this.cache.del(keysToDelete);
    return keysToDelete.length;
  }

  async flush(): Promise<void> {
    this.cache.flushAll();
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      keys: this.cache.keys().length,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }
}

const cacheService = new CacheService();
export default cacheService;
module.exports = cacheService; // For JS interoperability
