/**
 * Core Validation Utilities
 * Contains base validation functions, error classes, and HTML sanitization
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
export const createHtmlSchema = (minLength?: number, maxLength?: number) => {
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
export const emailSchema = z
  .string()
  .email("Must be a valid email address")
  .transform((val) => val.toLowerCase().trim());

// Custom URL schema
export const urlSchema = z.string().url("Must be a valid URL");

// Social links schema
export const socialLinksSchema = z.record(z.string(), z.string().url());

// Username schema
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username cannot exceed 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

// =================== CORE VALIDATION FUNCTIONS ===================

/**
 * Generic validation function for create operations
 */
export function validateCreate<T>(schema: z.ZodSchema<T>, data: unknown): T {
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
export function validateUpdate<T>(
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

// =================== HTML UTILITIES ===================

export const sanitizeHtml = (html: string): string =>
  htmlSanitizer.sanitize(html);
export const getHtmlTextLength = (html: string): number =>
  htmlSanitizer.getTextLength(html);
