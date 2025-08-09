/**
 * Forum Entity Validation Schemas
 * Contains topic, answer, category, and vote related schemas and validation functions
 */

import { z } from "zod";
import {
  validateCreate,
  validateUpdate,
  createHtmlSchema,
} from "../../utils/validation.core";

// =================== FORUM SCHEMAS ===================

export const topicSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title cannot exceed 200 characters"),
  content: createHtmlSchema(10, 5000),
  userId: z.string().min(1, "User ID is required"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).max(10, "Cannot have more than 10 tags").optional(),
  images: z.array(z.string()).optional(),
  viewCount: z.number().min(0).default(0),
  isPinned: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
});

export const answerSchema = z.object({
  topicId: z.string().min(1, "Topic ID is required"),
  content: createHtmlSchema(10, 5000),
  userId: z.string().min(1, "User ID is required"),
  images: z.array(z.string()).optional(),
  isAccepted: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
  parentAnswerId: z.string().nullable().optional(),
});

export const voteSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  targetId: z.string().min(1, "Target ID is required"),
  targetType: z.enum(["topic", "answer", "bike", "profile"]),
  voteType: z.enum(["up", "down"]).nullable(),
});

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  description: z.string().max(200).optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format")
    .optional(),
  icon: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().min(0).default(0),
});

// =================== TYPE EXPORTS ===================

export type Topic = z.infer<typeof topicSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type Vote = z.infer<typeof voteSchema>;
export type Category = z.infer<typeof categorySchema>;

// =================== VALIDATION FUNCTIONS ===================

export const createTopic = (data: unknown): Topic =>
  validateCreate(topicSchema, data);

export const createAnswer = (data: unknown): Answer =>
  validateCreate(answerSchema, data);

export const createVote = (data: unknown): Vote =>
  validateCreate(voteSchema, data);

export const createCategory = (data: unknown): Category =>
  validateCreate(categorySchema, data);

export const updateTopic = (data: unknown): Partial<Topic> =>
  validateUpdate(topicSchema, data);

export const updateAnswer = (data: unknown): Partial<Answer> =>
  validateUpdate(answerSchema, data);

export const updateCategory = (data: unknown): Partial<Category> =>
  validateUpdate(categorySchema, data);
