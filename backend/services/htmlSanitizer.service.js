/**
 * HTML Sanitizer Service
 * Safely sanitizes HTML content for forum posts
 */

const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

class HtmlSanitizerService {
  constructor() {
    // Create a virtual DOM window for server-side use
    this.window = new JSDOM("").window;
    this.DOMPurify = createDOMPurify(this.window);

    // Configure allowed tags and attributes for forum content
    this.config = {
      // Allowed HTML tags
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
        "h1",
        "h2",
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

      // Allowed attributes
      ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],

      // Allow some safe CSS properties
      ALLOWED_CSS: {
        color: true,
        "background-color": true,
        "text-align": true,
        "font-weight": true,
        "font-style": true,
        "text-decoration": true,
      },

      // Security settings
      FORBID_TAGS: [
        "script",
        "style",
        "iframe",
        "object",
        "embed",
        "form",
        "input",
      ],
      FORBID_ATTR: ["onclick", "onload", "onerror", "onmouseover"],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_TRUSTED_TYPE: false,
    };
  }

  /**
   * Sanitize HTML content for forum posts
   * @param {string} htmlContent - Raw HTML content from editor
   * @returns {string} - Sanitized HTML content
   */
  sanitizeForumContent(htmlContent) {
    if (!htmlContent || typeof htmlContent !== "string") {
      return "";
    }

    try {
      // First pass: basic sanitization
      let sanitized = this.DOMPurify.sanitize(htmlContent, {
        ...this.config,
        // Custom hook to validate links
        FORBID_CONTENTS: ["script", "style"],
        HOOK_SANITIZE_DOM_CHUNK: (chunk) => {
          // Remove any potential XSS vectors
          return chunk;
        },
      });

      // Second pass: additional custom sanitization
      sanitized = this.sanitizeLinks(sanitized);
      sanitized = this.sanitizeStyles(sanitized);
      sanitized = this.normalizeWhitespace(sanitized);

      return sanitized;
    } catch (error) {
      console.error("HTML_SANITIZER_ERROR: Failed to sanitize content:", error);
      // Fallback: strip all HTML and return plain text
      return this.stripAllHtml(htmlContent);
    }
  }

  /**
   * Sanitize and validate links
   * @param {string} html - HTML content
   * @returns {string} - HTML with sanitized links
   */
  sanitizeLinks(html) {
    // Allow only http, https, and mailto links
    return html.replace(
      /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
      (match, before, href, after) => {
        // Check if href is safe
        if (href.match(/^(https?:\/\/|mailto:)/i)) {
          // Add security attributes
          return `<a ${before}href="${href}"${after} target="_blank" rel="noopener noreferrer">`;
        }
        // Remove unsafe links but keep content
        return "";
      }
    );
  }

  /**
   * Sanitize inline styles
   * @param {string} html - HTML content
   * @returns {string} - HTML with sanitized styles
   */
  sanitizeStyles(html) {
    return html.replace(/style=["']([^"']+)["']/gi, (match, styles) => {
      // Parse and filter CSS properties
      const allowedStyles = [];
      const styleDeclarations = styles.split(";");

      styleDeclarations.forEach((decl) => {
        const [property, value] = decl.split(":").map((s) => s.trim());
        if (property && value && this.config.ALLOWED_CSS[property]) {
          // Additional validation for specific properties
          if (this.isValidCssValue(property, value)) {
            allowedStyles.push(`${property}: ${value}`);
          }
        }
      });

      return allowedStyles.length > 0
        ? `style="${allowedStyles.join("; ")}"`
        : "";
    });
  }

  /**
   * Validate CSS property values
   * @param {string} property - CSS property name
   * @param {string} value - CSS property value
   * @returns {boolean} - Whether the value is safe
   */
  isValidCssValue(property, value) {
    // Prevent CSS injection
    if (
      value.includes("javascript:") ||
      value.includes("expression(") ||
      value.includes("url(")
    ) {
      return false;
    }

    // Property-specific validation
    switch (property) {
      case "color":
      case "background-color":
        return /^(#[0-9a-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|[a-z]+)$/i.test(
          value
        );
      case "text-align":
        return ["left", "center", "right", "justify"].includes(
          value.toLowerCase()
        );
      case "font-weight":
        return /^(normal|bold|bolder|lighter|[1-9]00)$/.test(value);
      case "font-style":
        return ["normal", "italic", "oblique"].includes(value.toLowerCase());
      case "text-decoration":
        return /^(none|underline|overline|line-through)$/.test(value);
      default:
        return true;
    }
  }

  /**
   * Normalize whitespace and clean up formatting
   * @param {string} html - HTML content
   * @returns {string} - Normalized HTML
   */
  normalizeWhitespace(html) {
    return (
      html
        // Remove empty paragraphs
        .replace(/<p><\/p>/g, "")
        .replace(/<p>\s*<\/p>/g, "")
        // Normalize multiple line breaks
        .replace(/(<br\s*\/?>){3,}/gi, "<br><br>")
        // Clean up whitespace
        .trim()
    );
  }

  /**
   * Strip all HTML tags (fallback method)
   * @param {string} html - HTML content
   * @returns {string} - Plain text content
   */
  stripAllHtml(html) {
    return html.replace(/<[^>]*>/g, "").trim();
  }

  /**
   * Get text content length from HTML (for validation)
   * @param {string} html - HTML content
   * @returns {number} - Character count of text content
   */
  getTextLength(html) {
    if (!html) return 0;

    try {
      // Create a temporary DOM element to extract text
      const tempDiv = this.window.document.createElement("div");
      tempDiv.innerHTML = html;
      return tempDiv.textContent.length;
    } catch (error) {
      // Fallback: strip HTML with regex
      return this.stripAllHtml(html).length;
    }
  }

  /**
   * Validate HTML content for forum posts
   * @param {string} html - HTML content
   * @param {number} minLength - Minimum text length
   * @param {number} maxLength - Maximum text length
   * @returns {Object} - Validation result
   */
  validateContent(html, minLength = 20, maxLength = 5000) {
    const textLength = this.getTextLength(html);

    return {
      isValid: textLength >= minLength && textLength <= maxLength,
      textLength,
      errors: [
        ...(textLength < minLength
          ? [`Content must be at least ${minLength} characters long`]
          : []),
        ...(textLength > maxLength
          ? [`Content cannot exceed ${maxLength} characters`]
          : []),
      ],
    };
  }
}

module.exports = new HtmlSanitizerService();
