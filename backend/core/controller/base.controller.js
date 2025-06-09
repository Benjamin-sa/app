const cacheService = require("../services/cache.service");

class BaseController {
  constructor(controllerName = "base") {
    this.controllerName = controllerName.toUpperCase();
    this.cache = cacheService;

    // Bind methods to preserve 'this' context
    Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(
        (method) =>
          method !== "constructor" && typeof this[method] === "function"
      )
      .forEach((method) => (this[method] = this[method].bind(this)));
  }

  // Handle errors with consistent status codes and formatting
  handleError(res, error, operation) {
    console.error(
      `${this.controllerName}_CONTROLLER_ERROR: ${operation} failed:`,
      error
    );

    const statusCode = error.message.includes("VALIDATION_ERROR")
      ? 400
      : error.message.includes("NOT_FOUND_ERROR")
      ? 404
      : error.message.includes("UNAUTHORIZED")
      ? 403
      : 500;

    res.status(statusCode).json({
      success: false,
      error: `${this.controllerName}_CONTROLLER_ERROR: ${error.message}`,
      errorSource: `${this.controllerName.toLowerCase()}_controller`,
    });
  }

  // Get cached data or fetch fresh data with TTL
  async getCachedData(key, fetchFunction, ttlSeconds = 300) {
    try {
      const cachedData = await this.cache.get(key);
      if (cachedData !== null) {
        return cachedData;
      }
      const freshData = await fetchFunction();

      if (freshData !== null && freshData !== undefined) {
        await this.cache.set(key, freshData, ttlSeconds);
      }

      return freshData;
    } catch (error) {
      console.error(
        `❌ CACHE ERROR: ${this.controllerName} - Key: ${key}`,
        error.message
      );
      // Fallback to direct fetch if cache fails
      return await fetchFunction();
    }
  }

  async invalidateCache(pattern) {
    return cacheService.invalidatePattern(pattern);
  }

  async deleteCache(key) {
    return cacheService.del(key);
  }

  // Send standardized success response
  sendSuccess(res, data, status = 200, message = null) {
    const response = { success: true, data };
    if (message) response.message = message;
    return res.status(status).json(response);
  }
}

module.exports = BaseController;
