/**
 * TypeScript Base Controller
 * Provides common functionality for all controllers with type safety
 */

import { Request, Response } from "express";
import cacheService from "../services/cache.service";

// =================== TYPE DEFINITIONS ===================

interface WrapOptions {
  status?: number;
  op?: string;
  map?: (result: any) => any;
  message?: string | ((result: any) => string);
}

interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  errorSource: string;
}

// =================== BASE CONTROLLER CLASS ===================

export class BaseController {
  protected controllerName: string;
  protected cache: any;
  [key: string]: any; // Index signature for dynamic method binding

  constructor(controllerName: string = "base") {
    this.controllerName = controllerName.toUpperCase();
    this.cache = cacheService;

    // Bind prototype methods (instance arrow functions don't need binding)
    Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(
        (method) =>
          method !== "constructor" && typeof this[method] === "function"
      )
      .forEach((method) => (this[method] = this[method].bind(this)));
  }

  // =================== WRAPPER METHOD ===================

  /**
   * Generic wrapper to eliminate repetitive try/catch in controllers
   */
  protected wrap<T = any>(
    handler: (req: Request, res: Response) => Promise<T>,
    options: WrapOptions = {}
  ) {
    const { status = 200, op = null, map = (r) => r, message = null } = options;

    return async (req: Request, res: Response): Promise<Response> => {
      try {
        const result = await handler(req, res);
        const mappedResult = map(result);

        const responseMessage =
          typeof message === "function" ? message(mappedResult) : message;

        return this.sendSuccess(
          res,
          mappedResult,
          status,
          responseMessage || undefined
        );
      } catch (error) {
        return this.handleError(res, error, op || handler.name || "Operation");
      }
    };
  }

  // =================== ERROR HANDLING ===================

  /**
   * Handle errors with consistent status codes and formatting
   */
  protected handleError(
    res: Response,
    error: unknown,
    operation: string
  ): Response {
    console.error(
      `${this.controllerName}_CONTROLLER_ERROR: ${operation} failed:`,
      error
    );

    const errorMessage = error instanceof Error ? error.message : String(error);

    const statusCode = errorMessage.includes("VALIDATION_ERROR")
      ? 400
      : errorMessage.includes("NOT_FOUND_ERROR")
      ? 404
      : errorMessage.includes("UNAUTHORIZED")
      ? 403
      : 500;

    return res.status(statusCode).json({
      success: false,
      error: `${this.controllerName}_CONTROLLER_ERROR: ${errorMessage}`,
      errorSource: `${this.controllerName.toLowerCase()}_controller`,
    } as ErrorResponse);
  }

  // =================== CACHING METHODS ===================

  /**
   * Get cached data or fetch fresh data with TTL
   */
  protected async getCachedData<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
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
        error instanceof Error ? error.message : String(error)
      );
      // Fallback to direct fetch if cache fails
      return await fetchFunction();
    }
  }

  /**
   * Invalidate cache by pattern
   */
  protected async invalidateCache(pattern: string): Promise<void> {
    await cacheService.invalidatePattern(pattern);
  }

  /**
   * Delete specific cache key
   */
  protected async deleteCache(key: string): Promise<void> {
    await cacheService.del(key);
  }

  // =================== RESPONSE METHODS ===================

  /**
   * Send standardized success response
   */
  protected sendSuccess<T>(
    res: Response,
    data: T,
    status: number = 200,
    message?: string
  ): Response {
    const response: SuccessResponse<T> = { success: true, data };
    if (message) response.message = message;
    return res.status(status).json(response);
  }
}

export default BaseController;
