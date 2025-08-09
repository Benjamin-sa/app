/**
 * User Entity Validation Schemas
 * Contains user profile related schemas and validation functions
 */

import { z } from "zod";
import {
  validateCreate,
  validateUpdate,
  emailSchema,
  urlSchema,
  socialLinksSchema,
  usernameSchema,
} from "../../utils/validation.core";

// =================== USER SCHEMAS ===================

export const userProfileSchema = z.object({
  uid: z.string().min(1, "UID is required"),
  username: usernameSchema,
  email: emailSchema,
  displayName: z.string().max(50).optional(),
  avatar: urlSchema.optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: urlSchema.optional(),
  reputation: z.number().min(0).default(0),
  topics_created: z.number().min(0).default(0),
  answers_posted: z.number().min(0).default(0),
  products_count: z.number().min(0).default(0),
  bikes_count: z.number().min(0).default(0),
  isVerified: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
  isModerator: z.boolean().default(false),
  show_email: z.boolean().default(false),
  allow_messages: z.boolean().default(true),
  interests: z.array(z.string()).optional(),
  social_links: socialLinksSchema.optional(),
});

// =================== TYPE EXPORTS ===================

export type UserProfile = z.infer<typeof userProfileSchema>;

// =================== VALIDATION FUNCTIONS ===================

export const createUserProfile = (data: unknown): UserProfile =>
  validateCreate(userProfileSchema, data);

export const updateUserProfile = (data: unknown): Partial<UserProfile> =>
  validateUpdate(userProfileSchema, data);
