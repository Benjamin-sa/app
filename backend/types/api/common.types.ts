/**
 * Utility Validation Schemas
 * Contains pagination, ID validation, and other utility schemas
 */

import { z } from "zod";
import { validateCreate } from "../../utils/validation.core";

// =================== UTILITY SCHEMAS ===================

export const paginationSchema = z.object({
  limit: z
    .number()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .optional(),
  offset: z.number().min(0, "Offset must be non-negative").optional(),
});

export const idSchema = z.string().min(1, "ID is required").trim();

// =================== TYPE EXPORTS ===================

export type PaginationOptions = z.infer<typeof paginationSchema>;

// =================== VALIDATION FUNCTIONS ===================

export const validateId = (id: unknown): string => {
  return validateCreate(idSchema, id);
};

export const validatePaginationOptions = (
  options: unknown
): PaginationOptions => {
  return validateCreate(paginationSchema, options);
};
