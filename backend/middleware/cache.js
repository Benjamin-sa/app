/**
 * Cache Middleware
 * Provides HTTP cache headers for routes
 */

const cacheService = require("../services/cache.service");

/**
 * Set HTTP cache headers
 * @param {number} maxAge - Cache max age in seconds
 * @returns {Function} Express middleware
 */
const setCacheHeaders =
  (maxAge = 300) =>
  (req, res, next) => {
    res.set("Cache-Control", `public, max-age=${maxAge}`);
    next();
  };

/**
 * Cache invalidation middleware for POST/PUT/DELETE requests
 * @param {string|string[]} patterns - Cache patterns to invalidate
 * @returns {Function} Express middleware
 */
const invalidateCache = (patterns) => async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    // Only invalidate cache on successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const patternsArray = Array.isArray(patterns) ? patterns : [patterns];

      // Invalidate cache patterns asynchronously
      Promise.all(
        patternsArray.map((pattern) => cacheService.invalidatePattern(pattern))
      ).catch((error) => {
        console.error("Cache invalidation error:", error);
      });
    }

    originalSend.call(this, data);
  };

  next();
};

/**
 * Cache middleware for GET requests
 * Tries to serve from cache first, then caches the response
 * @param {string} keyGenerator - Function to generate cache key from req
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
const cacheResponse =
  (keyGenerator, ttl = 300) =>
  async (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    try {
      const cacheKey =
        typeof keyGenerator === "function" ? keyGenerator(req) : keyGenerator;

      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        return res.json(cachedData);
      }

      // Store original res.json
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function (data) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, ttl).catch((error) => {
            console.error("Cache set error:", error);
          });
        }

        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };

/**
 * Get cache statistics
 */
const getCacheStats = async (req, res) => {
  try {
    const stats = cacheService.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Clear cache endpoint (admin only)
 */
const clearCache = async (req, res) => {
  try {
    const { pattern } = req.query;

    if (pattern) {
      const clearedKeys = await cacheService.invalidatePattern(pattern);
      res.json({
        success: true,
        message: `Cleared ${clearedKeys} cache entries matching pattern: ${pattern}`,
      });
    } else {
      await cacheService.flush();
      res.json({
        success: true,
        message: "Cache cleared successfully",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  setCacheHeaders,
  invalidateCache,
  cacheResponse,
  getCacheStats,
  clearCache,
};
