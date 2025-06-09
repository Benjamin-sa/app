/**
 * Comprehensive validation utilities that check and throw errors automatically
 * Moved from forum.models.js validators for centralized validation
 */

class ValidationUtils {
  /**
   * Validate required fields and throw error if any are missing
   * @param {Object} fields - Fields to validate { fieldName: value }
   * @param {string} serviceName - Service name for error messages
   * @param {string} operation - Operation name (optional)
   */
  static required(fields, serviceName, operation = "operation") {
    const missing = [];

    Object.entries(fields).forEach(([fieldName, value]) => {
      if (this.isEmpty(value)) {
        missing.push(fieldName);
      }
    });

    if (missing.length > 0) {
      const fieldList = missing.join(", ");
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldList} ${
          missing.length === 1 ? "is" : "are"
        } required for ${operation}`
      );
    }
  }

  /**
   * Validate email format and throw error if invalid
   * @param {string} email - Email address to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "email")
   */
  static email(email, serviceName, fieldName = "email") {
    if (this.isEmpty(email)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} is required`
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: Invalid ${fieldName} format`
      );
    }
  }

  /**
   * Validate username format and throw error if invalid
   * @param {string} username - Username to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "username")
   */
  static username(username, serviceName, fieldName = "username") {
    if (this.isEmpty(username)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} is required`
      );
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be 3-20 characters and contain only letters, numbers, and underscores`
      );
    }
  }

  /**
   * Validate topic title and throw error if invalid
   * @param {string} title - Topic title to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "title")
   */
  static topicTitle(title, serviceName, fieldName = "title") {
    if (this.isEmpty(title)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} is required`
      );
    }

    if (title.length < 5 || title.length > 200) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be between 5 and 200 characters`
      );
    }
  }

  /**
   * Validate content and throw error if invalid
   * @param {string} content - Content to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "content")
   */
  static content(content, serviceName, fieldName = "content") {
    if (this.isEmpty(content)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} is required`
      );
    }

    if (content.length < 10 || content.length > 10000) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be between 10 and 10000 characters`
      );
    }
  }

  /**
   * Validate HTML content and extract text length for validation
   * @param {string} htmlContent - HTML content to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "content")
   */
  static htmlContent(htmlContent, serviceName, fieldName = "content") {
    if (this.isEmpty(htmlContent)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} is required`
      );
    }

    // Extract text content from HTML for length validation
    const textContent = this.extractTextFromHtml(htmlContent);

    if (textContent.length < 10 || textContent.length > 10000) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} text content must be between 10 and 10000 characters`
      );
    }

    // Validate HTML size (raw HTML shouldn't be excessively large)
    if (htmlContent.length > 50000) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} HTML is too large (max 50KB)`
      );
    }
  }

  /**
   * Extract text content from HTML string
   * @param {string} html - HTML string to extract text from
   * @returns {string} - Plain text content
   */
  static extractTextFromHtml(html) {
    if (!html) return "";

    // Simple HTML tag removal for server-side validation
    // This is a basic implementation - for production you might want to use a proper HTML parser
    return html
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
      .replace(/&amp;/g, "&") // Replace &amp; with &
      .replace(/&lt;/g, "<") // Replace &lt; with <
      .replace(/&gt;/g, ">") // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .trim();
  }

  /**
   * Validate category and throw error if invalid
   * @param {string} category - Category to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "category")
   */
  static category(category, serviceName, fieldName = "category") {
    if (this.isEmpty(category)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} is required`
      );
    }

    if (category.length < 2 || category.length > 50) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be between 2 and 50 characters`
      );
    }
  }

  /**
   * Validate display name and throw error if invalid
   * @param {string} name - Display name to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "displayName")
   */
  static displayName(name, serviceName, fieldName = "displayName") {
    if (this.isEmpty(name)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} is required`
      );
    }

    if (name.length < 2 || name.length > 50) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be between 2 and 50 characters`
      );
    }
  }

  /**
   * Validate bio and throw error if invalid (optional field)
   * @param {string} bio - Bio to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "bio")
   */
  static bio(bio, serviceName, fieldName = "bio") {
    if (!this.isEmpty(bio) && bio.length > 500) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be 500 characters or less`
      );
    }
  }

  /**
   * Validate URL and throw error if invalid (optional field)
   * @param {string} url - URL to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "url")
   */
  static url(url, serviceName, fieldName = "url") {
    if (!this.isEmpty(url) && !/^https?:\/\/.+\..+/.test(url)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: Invalid ${fieldName} format`
      );
    }
  }

  /**
   * Validate location and throw error if invalid (optional field)
   * @param {string} location - Location to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "location")
   */
  static location(location, serviceName, fieldName = "location") {
    if (!this.isEmpty(location) && location.length > 100) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be 100 characters or less`
      );
    }
  }

  /**
   * Validate website and throw error if invalid (optional field)
   * @param {string} website - Website to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "website")
   */
  static website(website, serviceName, fieldName = "website") {
    if (!this.isEmpty(website) && !/^https?:\/\/.+\..+/.test(website)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: Invalid ${fieldName} format`
      );
    }
  }

  /**
   * Validate interests array and throw error if invalid (optional field)
   * @param {Array} interests - Interests to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "interests")
   */
  static interests(interests, serviceName, fieldName = "interests") {
    if (!this.isEmpty(interests)) {
      if (!Array.isArray(interests)) {
        throw new Error(
          `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be an array`
        );
      }
      if (interests.length > 10) {
        throw new Error(
          `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: Maximum 10 ${fieldName} allowed`
        );
      }
    }
  }

  /**
   * Validate social links and throw error if invalid (optional field)
   * @param {Object} links - Social links to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "social_links")
   */
  static socialLinks(links, serviceName, fieldName = "social_links") {
    if (!this.isEmpty(links)) {
      if (typeof links !== "object" || Array.isArray(links)) {
        throw new Error(
          `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be an object`
        );
      }
      if (Object.keys(links).length > 5) {
        throw new Error(
          `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: Maximum 5 ${fieldName} allowed`
        );
      }
    }
  }

  /**
   * Validate array and throw error if invalid
   * @param {any} value - Value to check
   * @param {string} fieldName - Field name for error message
   * @param {string} serviceName - Service name
   * @param {boolean} required - Whether the field is required (default: true)
   * @param {number} maxLength - Maximum array length (optional)
   */
  static array(
    value,
    fieldName,
    serviceName,
    required = true,
    maxLength = null
  ) {
    if (this.isEmpty(value)) {
      if (required) {
        throw new Error(
          `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} is required`
        );
      }
      return; // Skip validation if not required and empty
    }

    if (!Array.isArray(value)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be an array`
      );
    }

    if (maxLength && value.length > maxLength) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: Maximum ${maxLength} ${fieldName} allowed`
      );
    }
  }

  /**
   * Validate bike name and throw error if invalid
   * @param {string} name - Bike name to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "bike name")
   */
  static bikeName(name, serviceName, fieldName = "bike name") {
    if (this.isEmpty(name)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} is required`
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be between 2 and 100 characters`
      );
    }
  }

  /**
   * Validate bike brand and throw error if invalid (optional field)
   * @param {string} brand - Brand to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "brand")
   */
  static bikeBrand(brand, serviceName, fieldName = "brand") {
    if (!this.isEmpty(brand) && brand.length > 50) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be 50 characters or less`
      );
    }
  }

  /**
   * Validate bike model and throw error if invalid (optional field)
   * @param {string} model - Model to validate
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "model")
   */
  static bikeModel(model, serviceName, fieldName = "model") {
    if (!this.isEmpty(model) && model.length > 50) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be 50 characters or less`
      );
    }
  }

  /**
   * Validate and parse bike year
   * @param {any} year - Year to validate and parse
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "year")
   * @returns {number|null} Parsed year or null if empty
   */
  static bikeYear(year, serviceName, fieldName = "year") {
    if (this.isEmpty(year)) return null;

    const parsedYear = parseInt(year);
    const currentYear = new Date().getFullYear();

    if (
      isNaN(parsedYear) ||
      parsedYear < 1900 ||
      parsedYear > currentYear + 1
    ) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be between 1900 and ${
          currentYear + 1
        }`
      );
    }

    return parsedYear;
  }

  /**
   * Validate and parse bike engine size
   * @param {any} engineSize - Engine size to validate and parse
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "engine size")
   * @returns {number|null} Parsed engine size or null if empty
   */
  static bikeEngineSize(engineSize, serviceName, fieldName = "engine size") {
    if (this.isEmpty(engineSize)) return null;

    const parsedSize = parseInt(engineSize);

    if (isNaN(parsedSize) || parsedSize < 50 || parsedSize > 1000) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be between 50cc and 1000cc`
      );
    }

    return parsedSize;
  }

  /**
   * Validate and trim bike description (optional field)
   * @param {string} description - Description to validate and trim
   * @param {string} serviceName - Service name for error messages
   * @param {string} fieldName - Field name for error message (default: "description")
   * @returns {string} Trimmed description or empty string
   */
  static bikeDescription(description, serviceName, fieldName = "description") {
    if (this.isEmpty(description)) return "";

    const trimmedDescription = description.trim();

    if (trimmedDescription.length > 1000) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be 1000 characters or less`
      );
    }

    return trimmedDescription;
  }

  /**
   * Validate bike photos limit
   * @param {Array} existingPhotos - Existing photos array
   * @param {Array} newPhotos - New photos array
   * @param {string} serviceName - Service name for error messages
   * @param {number} maxPhotos - Maximum allowed photos (default: 10)
   */
  static bikePhotosLimit(
    existingPhotos,
    newPhotos,
    serviceName,
    maxPhotos = 10
  ) {
    const totalPhotos =
      (existingPhotos?.length || 0) + (newPhotos?.length || 0);

    if (totalPhotos > maxPhotos) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: Maximum ${maxPhotos} photos allowed per bike`
      );
    }
  }

  /**
   * Validate limit parameter for queries
   * @param {any} limit - Limit value to validate
   * @param {string} serviceName - Service name for error messages
   * @param {number} min - Minimum allowed limit (default: 1)
   * @param {number} max - Maximum allowed limit (default: 50)
   * @param {string} fieldName - Field name for error message (default: "limit")
   */
  static queryLimit(
    limit,
    serviceName,
    min = 1,
    max = 50,
    fieldName = "limit"
  ) {
    if (limit && (isNaN(limit) || limit < min || limit > max)) {
      throw new Error(
        `${serviceName.toUpperCase()}_SERVICE_VALIDATION_ERROR: ${fieldName} must be between ${min} and ${max}`
      );
    }
  }

  /**
   * Validate query page parameter
   */
  static queryPage(page, context) {
    if (page !== undefined && page !== null) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        throw new Error(`${context}: Page must be a positive integer`);
      }
      return pageNum;
    }
    return 1;
  }

  // Helper methods (don't throw errors, just return boolean)

  /**
   * Check if a value is considered empty (null, undefined, empty string)
   * @param {any} value - Value to check
   * @returns {boolean} True if empty
   */
  static isEmpty(value) {
    return value === null || value === undefined || value === "";
  }

  /**
   * Check if a value exists (not null, undefined, or empty string)
   * @param {any} value - Value to check
   * @returns {boolean} True if exists
   */
  static exists(value) {
    return !this.isEmpty(value);
  }

  // Legacy method names for backward compatibility
  static requireFields(fields, serviceName, operation) {
    this.required(fields, serviceName, operation);
  }

  static validateRequired(config) {
    this.required(config.fields, config.serviceName, config.operation);
  }
}

module.exports = ValidationUtils;
