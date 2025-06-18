/**
 * Comprehensive Validation System for Forum Models
 * Provides factory functions for creating and updating validated data objects
 * Returns only provided/valid fields to prevent null writes to Firebase
 * Includes integrated HTML sanitization for content fields
 */

const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

// =================== CUSTOM ERROR CLASSES ===================

class ValidationError extends Error {
  constructor(field, message, value) {
    super(`Validation failed for field '${field}': ${message}`);
    this.name = "ValidationError";
    this.field = field;
    this.value = value;
  }
}

// =================== VALIDATION SCHEMAS ===================

const VALIDATION_SCHEMAS = {
  UserProfile: {
    uid: { type: "string", required: true, minLength: 1 },
    username: {
      type: "string",
      required: true,
      minLength: 3,
      maxLength: 30,
      pattern: /^[a-zA-Z0-9_]+$/,
    },
    email: { type: "email", required: true },
    displayName: { type: "string", maxLength: 50 },
    avatar: { type: "url" },
    bio: { type: "string", maxLength: 500 },
    location: { type: "string", maxLength: 100 },
    website: { type: "url" },
    reputation: { type: "number", min: 0, default: 0 },
    topics_created: { type: "number", min: 0, default: 0 },
    answers_posted: { type: "number", min: 0, default: 0 },
    products_count: { type: "number", min: 0, default: 0 },
    bikes_count: { type: "number", min: 0, default: 0 },
    isVerified: { type: "boolean", default: false },
    isDeleted: { type: "boolean", default: false },
    isAdmin: { type: "boolean", default: false },
    isModerator: { type: "boolean", default: false },
    show_email: { type: "boolean", default: false },
    allow_messages: { type: "boolean", default: true },
    interests: { type: "array", itemType: "string" },
    social_links: { type: "object", validation: "social_links" },
  },

  Topic: {
    title: { type: "string", required: true, minLength: 5, maxLength: 200 },
    content: { type: "html", required: true, minLength: 10, maxLength: 5000 },
    userId: { type: "string", required: true },
    category: { type: "string", required: true },
    tags: { type: "array", itemType: "string", maxItems: 10 },
    images: { type: "array" },
    viewCount: { type: "number", min: 0, default: 0 },
    isPinned: { type: "boolean", default: false },
    isLocked: { type: "boolean", default: false },
    isDeleted: { type: "boolean", default: false },
  },

  Answer: {
    topicId: { type: "string", required: true },
    content: { type: "html", required: true, minLength: 10, maxLength: 5000 },
    userId: { type: "string", required: true },
    images: { type: "array" },
    isAccepted: { type: "boolean", default: false },
    isDeleted: { type: "boolean", default: false },
    parentAnswerId: { type: "string", nullable: true },
  },

  Vote: {
    userId: { type: "string", required: true },
    targetId: { type: "string", required: true },
    targetType: {
      type: "enum",
      required: true,
      values: ["topic", "answer", "bike", "profile"],
    },
    voteType: {
      type: "enum",
      required: true,
      values: ["up", "down"],
      nullable: true,
    },
  },

  Category: {
    name: { type: "string", required: true, minLength: 2, maxLength: 50 },
    description: { type: "string", maxLength: 200 },
    color: { type: "string", pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ },
    icon: { type: "string", maxLength: 50 },
    isActive: { type: "boolean", default: true },
    sortOrder: { type: "number", min: 0, default: 0 },
  },

  Bike: {
    userId: { type: "string", required: true },
    name: { type: "string", required: true, minLength: 2, maxLength: 100 },
    brand: { type: "string", required: true, minLength: 2, maxLength: 50 },
    model: { type: "string", required: true, minLength: 1, maxLength: 50 },
    year: { type: "number", min: 1900, max: new Date().getFullYear() + 1 },
    engine_size: { type: "number", min: 1, max: 5000 },
    description: { type: "html", maxLength: 2000 },
    main_image: { type: "string" },
    photos: { type: "array" },
    is_featured: { type: "boolean", default: false },
    isDeleted: { type: "boolean", default: false },
    view_count: { type: "number", min: 0, default: 0 },
    like_count: { type: "number", min: 0, default: 0 },
  },

  Message: {
    senderId: { type: "string", required: true },
    receiverId: { type: "string", required: true },
    conversationId: { type: "string", required: true },
    content: { type: "string", required: true, minLength: 1, maxLength: 5000 },
    messageType: {
      type: "enum",
      default: "text",
      values: ["text", "image", "file"],
    },
    attachments: { type: "array" },
    isDeleted: { type: "boolean", default: false },
  },

  Conversation: {
    participants: {
      type: "array",
      required: true,
      itemType: "string",
      minItems: 2,
      maxItems: 2,
    },
    lastMessage: { type: "string", maxLength: 100 },
    lastMessageBy: { type: "string" },
    isArchived: { type: "boolean", default: false },
    unreadCount: { type: "object" },
  },
};

// =================== HTML SANITIZATION ===================

class HtmlSanitizer {
  constructor() {
    // Create a virtual DOM window for server-side use
    this.window = new JSDOM("").window;
    this.DOMPurify = createDOMPurify(this.window);

    // Simplified config for forum content
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

  /**
   * Sanitize HTML content for forum posts
   */
  sanitize(htmlContent) {
    if (!htmlContent || typeof htmlContent !== "string") {
      return "";
    }

    try {
      // Basic sanitization with DOMPurify
      let sanitized = this.DOMPurify.sanitize(htmlContent, this.config);

      // Additional link security
      sanitized = sanitized.replace(
        /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
        (match, before, href, after) => {
          if (href.match(/^(https?:\/\/|mailto:)/i)) {
            return `<a ${before}href="${href}"${after} target="_blank" rel="noopener noreferrer">`;
          }
          return ""; // Remove unsafe links
        }
      );

      // Clean up formatting
      return sanitized
        .replace(/<p><\/p>/g, "")
        .replace(/<p>\s*<\/p>/g, "")
        .replace(/(<br\s*\/?>){3,}/gi, "<br><br>")
        .trim();
    } catch (error) {
      console.error("HTML_SANITIZER_ERROR:", error);
      // Fallback: strip all HTML
      return htmlContent.replace(/<[^>]*>/g, "").trim();
    }
  }

  /**
   * Get text length from HTML (for validation)
   */
  getTextLength(html) {
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

// Create singleton instance
const htmlSanitizer = new HtmlSanitizer();

// =================== VALIDATION UTILITIES ===================

/**
 * Check if value exists (not null, undefined, or empty string)
 */
const exists = (value) => {
  return value !== null && value !== undefined && value !== "";
};

/**
 * Validates email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates URL format
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates social links object structure
 */
const validateSocialLinks = (socialLinks) => {
  if (typeof socialLinks !== "object" || Array.isArray(socialLinks)) {
    return false;
  }

  // Check if all values are valid URLs
  for (const [key, value] of Object.entries(socialLinks)) {
    if (typeof value !== "string" || !isValidUrl(value)) {
      return false;
    }
  }
  return true;
};

/**
 * Sanitizes string input
 */
const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  return str.trim();
};

// =================== CORE VALIDATION ENGINE ===================

/**
 * Validates a single field according to its schema rules
 */
const validateField = (fieldName, value, rules, isCreate = true) => {
  // Handle nullable fields first
  if (rules.nullable && value === null) {
    return null;
  }

  // Handle required fields
  if (rules.required && isCreate && !exists(value)) {
    throw new ValidationError(fieldName, "Field is required", value);
  }

  // If value is undefined/null and not required, skip validation
  if (value === undefined || value === null) {
    return rules.default !== undefined ? rules.default : undefined;
  }

  // Type validation
  switch (rules.type) {
    case "string":
      if (typeof value !== "string") {
        throw new ValidationError(fieldName, "Must be a string", value);
      }
      value = sanitizeString(value);

      if (rules.minLength && value.length < rules.minLength) {
        throw new ValidationError(
          fieldName,
          `Must be at least ${rules.minLength} characters`,
          value
        );
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        throw new ValidationError(
          fieldName,
          `Must be no more than ${rules.maxLength} characters`,
          value
        );
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        throw new ValidationError(fieldName, "Invalid format", value);
      }
      break;

    case "html":
      if (typeof value !== "string") {
        throw new ValidationError(fieldName, "Must be a string", value);
      }

      // Sanitize HTML content
      value = htmlSanitizer.sanitize(value);

      // Validate text length after HTML sanitization
      const textLength = htmlSanitizer.getTextLength(value);
      if (rules.minLength && textLength < rules.minLength) {
        throw new ValidationError(
          fieldName,
          `Content must be at least ${rules.minLength} characters`,
          value
        );
      }
      if (rules.maxLength && textLength > rules.maxLength) {
        throw new ValidationError(
          fieldName,
          `Content cannot exceed ${rules.maxLength} characters`,
          value
        );
      }
      break;

    case "enum":
      if (exists(value) && !rules.values.includes(value)) {
        throw new ValidationError(
          fieldName,
          `Must be one of: ${rules.values.join(", ")}, or null`,
          value
        );
      }
      break;

    case "email":
      if (typeof value !== "string" || !isValidEmail(value)) {
        throw new ValidationError(
          fieldName,
          "Must be a valid email address",
          value
        );
      }
      value = sanitizeString(value).toLowerCase();
      break;

    case "url":
      if (typeof value !== "string" || !isValidUrl(value)) {
        throw new ValidationError(fieldName, "Must be a valid URL", value);
      }
      value = sanitizeString(value);
      break;

    case "number":
      if (typeof value !== "number" || isNaN(value)) {
        throw new ValidationError(fieldName, "Must be a number", value);
      }
      if (rules.min !== undefined && value < rules.min) {
        throw new ValidationError(
          fieldName,
          `Must be at least ${rules.min}`,
          value
        );
      }
      if (rules.max !== undefined && value > rules.max) {
        throw new ValidationError(
          fieldName,
          `Must be no more than ${rules.max}`,
          value
        );
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        throw new ValidationError(fieldName, "Must be a boolean", value);
      }
      break;

    case "array":
      if (!Array.isArray(value)) {
        throw new ValidationError(fieldName, "Must be an array", value);
      }
      if (rules.minItems && value.length < rules.minItems) {
        throw new ValidationError(
          fieldName,
          `Must have at least ${rules.minItems} items`,
          value
        );
      }
      if (rules.maxItems && value.length > rules.maxItems) {
        throw new ValidationError(
          fieldName,
          `Must have no more than ${rules.maxItems} items`,
          value
        );
      }
      if (rules.itemType) {
        value.forEach((item, index) => {
          if (typeof item !== rules.itemType) {
            throw new ValidationError(
              `${fieldName}[${index}]`,
              `Must be ${rules.itemType}`,
              item
            );
          }
        });
      }
      break;

    case "object":
      if (typeof value !== "object" || Array.isArray(value)) {
        throw new ValidationError(fieldName, "Must be an object", value);
      }

      // Custom validation for specific object types
      if (rules.validation === "social_links" && !validateSocialLinks(value)) {
        throw new ValidationError(
          fieldName,
          "Invalid social links format",
          value
        );
      }
      break;

    default:
      throw new ValidationError(
        fieldName,
        `Unknown validation type: ${rules.type}`,
        value
      );
  }

  return value;
};

/**
 * Validates an object against a schema
 */
const validateObject = (data, schema, isCreate = true) => {
  const validatedData = {};

  // Validate each field in the schema
  for (const [fieldName, rules] of Object.entries(schema)) {
    try {
      const validatedValue = validateField(
        fieldName,
        data[fieldName],
        rules,
        isCreate
      );

      // Only include field if it has a value (prevents null writes to Firebase)
      if (validatedValue !== undefined) {
        validatedData[fieldName] = validatedValue;
      }
    } catch (error) {
      // Re-throw with more context
      throw error;
    }
  }

  return validatedData;
};

// =================== CREATE FUNCTIONS (STRICT VALIDATION) ===================

const createUserProfile = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.UserProfile, true);
};

const createTopic = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Topic, true);
};

const createAnswer = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Answer, true);
};

const createVote = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Vote, true);
};

const createCategory = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Category, true);
};

const createBike = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Bike, true);
};

const createMessage = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Message, true);
};

const createConversation = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Conversation, true);
};

// =================== UPDATE FUNCTIONS (RELAXED VALIDATION) ===================

const updateUserProfile = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.UserProfile, false);
};

const updateTopic = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Topic, false);
};

const updateAnswer = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Answer, false);
};

const updateCategory = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Category, false);
};

const updateBike = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Bike, false);
};

const updateMessage = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Message, false);
};

const updateConversation = (data) => {
  return validateObject(data, VALIDATION_SCHEMAS.Conversation, false);
};

// =================== UTILITY VALIDATION FUNCTIONS ===================

/**
 * Validates an ID for delete operations
 */
const validateId = (id, fieldName = "id") => {
  if (!exists(id)) {
    throw new ValidationError(fieldName, "ID is required", id);
  }
  if (typeof id !== "string") {
    throw new ValidationError(fieldName, "ID must be a string", id);
  }
  if (id.trim().length === 0) {
    throw new ValidationError(fieldName, "ID cannot be empty", id);
  }
  return id.trim();
};

/**
 * Validates pagination options (limit, offset, etc.)
 */
const validatePaginationOptions = (options = {}) => {
  const validated = {};

  if (options.limit !== undefined) {
    if (
      typeof options.limit !== "number" ||
      options.limit < 1 ||
      options.limit > 100
    ) {
      throw new ValidationError(
        "limit",
        "Limit must be a number between 1 and 100",
        options.limit
      );
    }
    validated.limit = options.limit;
  }

  if (options.offset !== undefined) {
    if (typeof options.offset !== "number" || options.offset < 0) {
      throw new ValidationError(
        "offset",
        "Offset must be a non-negative number",
        options.offset
      );
    }
    validated.offset = options.offset;
  }

  return validated;
};

// =================== EXPORTS ===================

module.exports = {
  // Error Classes
  ValidationError,

  // Create Functions
  createUserProfile,
  createTopic,
  createAnswer,
  createVote,
  createCategory,
  createBike,
  createMessage,
  createConversation,

  // Update Functions
  updateUserProfile,
  updateTopic,
  updateAnswer,
  updateCategory,
  updateBike,
  updateMessage,
  updateConversation,

  // Utility Functions
  exists,
  isValidEmail,
  isValidUrl,
  validateSocialLinks,
  validateId,
  validatePaginationOptions,

  // HTML Sanitization
  sanitizeHtml: (html) => htmlSanitizer.sanitize(html),
  getHtmlTextLength: (html) => htmlSanitizer.getTextLength(html),

  // Core Engine (for advanced usage)
  validateObject,
  validateField,

  // Schemas (for reference)
  VALIDATION_SCHEMAS,
};
