import {
  CATEGORY_STYLES,
  CATEGORY_LABELS,
  DEFAULT_CATEGORY_STYLE,
  DEFAULT_CATEGORY_LABEL,
} from "./constants.repository.js";

// =============================================================================
// CATEGORY UTILITIES
// =============================================================================

/**
 * Get CSS class for a forum category
 * @param {string} category - The category name
 * @returns {string} CSS class name for the category
 */
export function getCategoryClass(category) {
  return CATEGORY_STYLES[category] || DEFAULT_CATEGORY_STYLE;
}

/**
 * Get display label for a forum category
 * @param {string} category - The category name
 * @returns {string} Formatted category label
 */
export function getCategoryLabel(category) {
  return (
    CATEGORY_LABELS[category] ||
    category?.charAt(0).toUpperCase() + category?.slice(1) ||
    DEFAULT_CATEGORY_LABEL
  );
}

// =============================================================================
// DATE & TIME UTILITIES
// =============================================================================

/**
 * Convert Firestore timestamp to JavaScript Date object
 * @param {Object|Date|string|number} timestamp - Firestore timestamp or other date format
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
export function convertFirestoreTimestamp(timestamp) {
  if (!timestamp) return null;

  // Check if it's a Firestore timestamp with _seconds
  if (timestamp._seconds !== undefined) {
    return new Date(
      timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000
    );
  }

  // Check if it's already a Date object or valid date string
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string" || typeof timestamp === "number") {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Format date using Intl.DateTimeFormat
 * @param {Date|Object} date - Date object or Firestore timestamp
 * @param {Object} options - Formatting options for Intl.DateTimeFormat
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return "";

  // Convert Firestore timestamp if needed
  const dateObj = convertFirestoreTimestamp(date);
  if (!dateObj) return "";

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat("en-US", defaultOptions).format(dateObj);
}

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

/**
 * Format large numbers with K/M suffixes
 * @param {number} number - Number to format
 * @returns {string} Formatted number string (e.g., "1.2K", "2.5M")
 */
export function formatNumber(number) {
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  return number.toString();
}

/**
 * Format content by converting line breaks to HTML <br> tags
 * @param {string} content - Text content to format
 * @returns {string} HTML formatted content
 */
export function formatContent(content) {
  if (!content) return "";

  // Convert line breaks to <br> tags
  return content.replace(/\n/g, "<br>");
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email format is valid
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format (3-20 characters, letters, numbers, underscores only)
 * @param {string} username - Username to validate
 * @returns {boolean} True if username format is valid
 */
export function validateUsername(username) {
  // Username should be 3-20 characters, only letters, numbers, and underscores
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a debounced version of a function that delays execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
