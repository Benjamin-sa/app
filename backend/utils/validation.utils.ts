/**
 * TypeScript + Zod Validation System
 * Replaces the custom validation system with Zod schemas
 * Provides both runtime validation and compile-time type safety
 */

import { z } from "zod";
const createDOMPurify = require("dompurify");
import { JSDOM } from "jsdom";

// =================== CUSTOM ERROR CLASSES ===================

export class ValidationError extends Error {
  constructor(public field: string, message: string, public value: unknown) {
    super(`Validation failed for field '${field}': ${message}`);
    this.name = "ValidationError";
  }
}

// =================== HTML SANITIZATION ===================

class HtmlSanitizer {
  private window: any;
  private DOMPurify: any;
  private config: any;

  constructor() {
    this.window = new JSDOM("").window;
    this.DOMPurify = createDOMPurify(this.window);

    this.config = {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "del",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "blockquote",
        "pre",
        "code",
        "a",
        "span",
      ],
      ALLOWED_ATTR: ["href", "target", "rel"],
      FORBID_TAGS: [
        "script",
        "style",
        "iframe",
        "object",
        "embed",
        "form",
        "input",
      ],
      FORBID_ATTR: ["onclick", "onload", "onerror", "onmouseover", "style"],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
    };
  }

  sanitize(htmlContent: string): string {
    if (!htmlContent || typeof htmlContent !== "string") {
      return "";
    }

    try {
      let sanitized = this.DOMPurify.sanitize(htmlContent, this.config);

      // Additional link security
      sanitized = sanitized.replace(
        /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
        (match: string, before: string, href: string, after: string) => {
          if (href.match(/^(https?:\/\/|mailto:)/i)) {
            return `<a ${before}href="${href}"${after} target="_blank" rel="noopener noreferrer">`;
          }
          return "";
        }
      );

      return sanitized
        .replace(/<p><\/p>/g, "")
        .replace(/<p>\s*<\/p>/g, "")
        .replace(/(<br\s*\/?>){3,}/gi, "<br><br>")
        .trim();
    } catch (error) {
      console.error("HTML_SANITIZER_ERROR:", error);
      return htmlContent.replace(/<[^>]*>/g, "").trim();
    }
  }

  getTextLength(html: string): number {
    if (!html) return 0;
    try {
      const tempDiv = this.window.document.createElement("div");
      tempDiv.innerHTML = html;
      return tempDiv.textContent.length;
    } catch (error) {
      return html.replace(/<[^>]*>/g, "").length;
    }
  }
}

const htmlSanitizer = new HtmlSanitizer();

// =================== CUSTOM ZOD TRANSFORMS ===================

// Custom Zod schema for HTML content with sanitization
const createHtmlSchema = (minLength?: number, maxLength?: number) => {
  return z
    .string()
    .transform((val) => htmlSanitizer.sanitize(val))
    .refine(
      (val) => {
        if (minLength && htmlSanitizer.getTextLength(val) < minLength) {
          return false;
        }
        if (maxLength && htmlSanitizer.getTextLength(val) > maxLength) {
          return false;
        }
        return true;
      },
      {
        message: `Content must be between ${minLength || 0} and ${
          maxLength || "unlimited"
        } characters`,
      }
    );
};

// Custom email schema with normalization
const emailSchema = z
  .string()
  .email("Must be a valid email address")
  .transform((val) => val.toLowerCase().trim());

// Custom URL schema
const urlSchema = z.string().url("Must be a valid URL");

// Social links schema
const socialLinksSchema = z.record(z.string(), z.string().url());

// Username schema
const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username cannot exceed 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

// =================== ZOD SCHEMAS ===================

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

export const messageSchema = z.object({
  senderId: z.string().min(1, "Sender ID is required"),
  receiverId: z.string().min(1, "Receiver ID is required"),
  conversationId: z.string().min(1, "Conversation ID is required"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(5000, "Content cannot exceed 5000 characters"),
  messageType: z.enum(["text", "image", "file"]).default("text"),
  attachments: z.array(z.string()).optional(),
  isDeleted: z.boolean().default(false),
});

export const conversationSchema = z.object({
  participants: z
    .array(z.string())
    .min(2, "Must have at least 2 participants")
    .max(2, "Cannot have more than 2 participants"),
  lastMessage: z.string().max(100).optional(),
  lastMessageBy: z.string().optional(),
  isArchived: z.boolean().default(false),
  unreadCount: z.record(z.string(), z.number()).optional(),
});

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

export type UserProfile = z.infer<typeof userProfileSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type Vote = z.infer<typeof voteSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Bike = z.infer<typeof bikeSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type PaginationOptions = z.infer<typeof paginationSchema>;

// =================== VALIDATION FUNCTIONS ===================

/**
 * Generic validation function for create operations
 */
function validateCreate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new ValidationError(
        firstError.path.join("."),
        firstError.message,
        firstError.code === "invalid_type"
          ? data
          : firstError.path.reduce((obj: any, key: any) => obj?.[key], data)
      );
    }
    throw error;
  }
}

/**
 * Generic validation function for update operations
 */
function validateUpdate<T>(
  schema: z.ZodObject<any>,
  data: unknown
): Partial<T> {
  try {
    return schema.partial().parse(data) as Partial<T>;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new ValidationError(
        firstError.path.join("."),
        firstError.message,
        firstError.code === "invalid_type"
          ? data
          : firstError.path.reduce((obj: any, key: any) => obj?.[key], data)
      );
    }
    throw error;
  }
}

// =================== CREATE FUNCTIONS ===================

export const createUserProfile = (data: unknown): UserProfile =>
  validateCreate(userProfileSchema, data);

export const createTopic = (data: unknown): Topic =>
  validateCreate(topicSchema, data);

export const createAnswer = (data: unknown): Answer =>
  validateCreate(answerSchema, data);

export const createVote = (data: unknown): Vote =>
  validateCreate(voteSchema, data);

export const createCategory = (data: unknown): Category =>
  validateCreate(categorySchema, data);

export const createBike = (data: unknown): Bike =>
  validateCreate(bikeSchema, data);

export const createMessage = (data: unknown): Message =>
  validateCreate(messageSchema, data);

export const createConversation = (data: unknown): Conversation =>
  validateCreate(conversationSchema, data);

// =================== UPDATE FUNCTIONS ===================

export const updateUserProfile = (data: unknown): Partial<UserProfile> =>
  validateUpdate(userProfileSchema, data);

export const updateTopic = (data: unknown): Partial<Topic> =>
  validateUpdate(topicSchema, data);

export const updateAnswer = (data: unknown): Partial<Answer> =>
  validateUpdate(answerSchema, data);

export const updateCategory = (data: unknown): Partial<Category> =>
  validateUpdate(categorySchema, data);

export const updateBike = (data: unknown): Partial<Bike> =>
  validateUpdate(bikeSchema, data);

export const updateMessage = (data: unknown): Partial<Message> =>
  validateUpdate(messageSchema, data);

export const updateConversation = (data: unknown): Partial<Conversation> =>
  validateUpdate(conversationSchema, data);

// =================== UTILITY FUNCTIONS ===================

export const validateId = (id: unknown): string => {
  return validateCreate(idSchema, id);
};

export const validatePaginationOptions = (
  options: unknown
): PaginationOptions => {
  return validateCreate(paginationSchema, options);
};

// =================== HTML UTILITIES ===================

export const sanitizeHtml = (html: string): string =>
  htmlSanitizer.sanitize(html);
export const getHtmlTextLength = (html: string): number =>
  htmlSanitizer.getTextLength(html);

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
