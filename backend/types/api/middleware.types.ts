/**
 * API Validation Middleware
 * Contains Express middleware for request validation
 */

import { z } from "zod";

// =================== MIDDLEWARE HELPERS ===================

/**
 * Express middleware factory for request body validation
 */
export const validateBody = <T>(schema: z.ZodSchema<T>) => {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        return res.status(400).json({
          success: false,
          error: `Validation failed for field '${firstError.path.join(".")}': ${
            firstError.message
          }`,
        });
      }
      next(error);
    }
  };
};

/**
 * Express middleware factory for query parameter validation
 */
export const validateQuery = <T>(schema: z.ZodSchema<T>) => {
  return (req: any, res: any, next: any) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        return res.status(400).json({
          success: false,
          error: `Invalid query parameter '${firstError.path.join(".")}': ${
            firstError.message
          }`,
        });
      }
      next(error);
    }
  };
};
