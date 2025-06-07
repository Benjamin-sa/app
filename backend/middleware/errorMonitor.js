/**
 * Error Monitor Middleware
 * Tracks and logs all errors from controllers for monitoring and debugging
 */

const fs = require("fs").promises;
const path = require("path");

class ErrorMonitor {
  constructor() {
    this.errorStats = new Map();
    this.logPath = path.join(__dirname, "../logs");
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logPath, { recursive: true });
    } catch (error) {
      console.error("Failed to create logs directory:", error);
    }
  }

  // Categorize error by its prefix
  categorizeError(errorMessage) {
    if (errorMessage.includes("_SERVICE_VALIDATION_ERROR:")) {
      return "VALIDATION_ERROR";
    } else if (errorMessage.includes("_SERVICE_NOT_FOUND_ERROR:")) {
      return "NOT_FOUND_ERROR";
    } else if (errorMessage.includes("_SERVICE_ERROR:")) {
      return "SERVICE_ERROR";
    } else if (errorMessage.includes("CONTROLLER_ERROR:")) {
      return "CONTROLLER_ERROR";
    } else {
      return "UNKNOWN_ERROR";
    }
  }

  // Get service from error message
  getServiceFromError(errorMessage) {
    const serviceMatch = errorMessage.match(/^(\w+_SERVICE)/);
    return serviceMatch ? serviceMatch[1] : "UNKNOWN_SERVICE";
  }

  // Log error to file
  async logErrorToFile(errorData) {
    try {
      const logFileName = `errors-${
        new Date().toISOString().split("T")[0]
      }.log`;
      const logFilePath = path.join(this.logPath, logFileName);

      const logEntry = {
        timestamp: new Date().toISOString(),
        ...errorData,
        separator: "---\n",
      };

      const logString = JSON.stringify(logEntry, null, 2) + "\n";
      await fs.appendFile(logFilePath, logString);
    } catch (logError) {
      console.error("Failed to write error log:", logError);
    }
  }

  // Update error statistics
  updateErrorStats(service, category) {
    const key = `${service}:${category}`;
    const current = this.errorStats.get(key) || {
      count: 0,
      lastOccurred: null,
    };

    this.errorStats.set(key, {
      count: current.count + 1,
      lastOccurred: new Date().toISOString(),
      service,
      category,
    });
  }

  // Main monitoring function
  async monitorError(req, error, responseData = {}) {
    try {
      const errorMessage = error.message || "Unknown error";
      const category = this.categorizeError(errorMessage);
      const service = this.getServiceFromError(errorMessage);

      // Create comprehensive error data
      const errorData = {
        message: errorMessage,
        category,
        service,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get("User-Agent"),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.uid || "anonymous",
        timestamp: new Date().toISOString(),
        stack: error.stack,
        statusCode: responseData.statusCode || 500,
        requestBody: this.sanitizeRequestBody(req.body),
        requestParams: req.params,
        requestQuery: req.query,
      };

      // Update statistics
      this.updateErrorStats(service, category);

      // Log to file
      await this.logErrorToFile(errorData);

      // Log to console with formatting
      console.error(`
🚨 ERROR MONITORED 🚨
Service: ${service}
Category: ${category}
Method: ${req.method} ${req.originalUrl}
User: ${req.user?.uid || "anonymous"}
Message: ${errorMessage}
Time: ${errorData.timestamp}
${"=".repeat(50)}`);

      return errorData;
    } catch (monitorError) {
      console.error("Error in error monitor:", monitorError);
    }
  }

  // Sanitize request body to remove sensitive data
  sanitizeRequestBody(body) {
    if (!body || typeof body !== "object") return body;

    const sanitized = { ...body };
    const sensitiveFields = ["password", "token", "secret", "key", "auth"];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = "***REDACTED***";
      }
    });

    return sanitized;
  }

  // Get error statistics
  getErrorStats() {
    const stats = {};
    this.errorStats.forEach((value, key) => {
      stats[key] = value;
    });
    return stats;
  }

  // Get error summary
  getErrorSummary() {
    const summary = {
      totalErrors: 0,
      byService: {},
      byCategory: {},
      recentErrors: [],
    };

    this.errorStats.forEach((value, key) => {
      summary.totalErrors += value.count;

      // Group by service
      if (!summary.byService[value.service]) {
        summary.byService[value.service] = 0;
      }
      summary.byService[value.service] += value.count;

      // Group by category
      if (!summary.byCategory[value.category]) {
        summary.byCategory[value.category] = 0;
      }
      summary.byCategory[value.category] += value.count;
    });

    return summary;
  }
}

const errorMonitor = new ErrorMonitor();

// Middleware function
const monitorErrors = async (req, res, next) => {
  // Store original res.json and res.status methods
  const originalJson = res.json;
  const originalStatus = res.status;

  let statusCode = 200;

  // Override res.status to capture status code
  res.status = function (code) {
    statusCode = code;
    return originalStatus.call(this, code);
  };

  // Override res.json to monitor errors
  res.json = async function (data) {
    // Monitor if this is an error response
    if (!data.success && data.error) {
      const error = new Error(data.error);
      await errorMonitor.monitorError(req, error, { statusCode });
    }

    return originalJson.call(this, data);
  };

  next();
};

// Export both the middleware and the monitor instance for stats
module.exports = {
  monitorErrors,
  getErrorStats: () => errorMonitor.getErrorStats(),
  getErrorSummary: () => errorMonitor.getErrorSummary(),
};
