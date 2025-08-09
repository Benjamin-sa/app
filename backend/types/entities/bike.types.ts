/**
 * Bike Entity Validation Schemas
 * Contains bike related schemas and validation functions
 */

import { z } from "zod";
import {
  validateCreate,
  validateUpdate,
  createHtmlSchema,
} from "../../utils/validation.core";

// =================== BIKE SCHEMAS ===================

export const bikeSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  brand: z
    .string()
    .min(2, "Brand must be at least 2 characters")
    .max(50, "Brand cannot exceed 50 characters"),
  model: z
    .string()
    .min(1, "Model is required")
    .max(50, "Model cannot exceed 50 characters"),
  year: z
    .number()
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  engine_size: z
    .number()
    .min(1, "Engine size must be at least 1cc")
    .max(5000, "Engine size cannot exceed 5000cc")
    .optional(),
  description: createHtmlSchema(undefined, 2000).optional(),
  main_image: z.string().optional(),
  photos: z.array(z.string()).optional(),
  is_featured: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
  view_count: z.number().min(0).default(0),
  like_count: z.number().min(0).default(0),
});

// =================== TYPE EXPORTS ===================

export type Bike = z.infer<typeof bikeSchema>;

// =================== VALIDATION FUNCTIONS ===================

export const createBike = (data: unknown): Bike =>
  validateCreate(bikeSchema, data);

export const updateBike = (data: unknown): Partial<Bike> =>
  validateUpdate(bikeSchema, data);
