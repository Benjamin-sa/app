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

  try {
    // Check if it's a Firestore timestamp with _seconds
    if (timestamp._seconds !== undefined) {
      const seconds = timestamp._seconds;
      const nanoseconds = timestamp._nanoseconds || 0;

      // Validate the timestamp values
      if (!isFinite(seconds) || !isFinite(nanoseconds)) return null;
      if (seconds < 0 || nanoseconds < 0) return null;

      const date = new Date(seconds * 1000 + nanoseconds / 1000000);
      return isNaN(date.getTime()) ? null : date;
    }

    // Check if it's already a Date object
    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? null : timestamp;
    }

    // Handle string or number timestamps
    if (typeof timestamp === "string" || typeof timestamp === "number") {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }

    // Handle Firestore Timestamp objects (with toDate method)
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      const date = timestamp.toDate();
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  } catch (error) {
    console.warn("Error converting Firestore timestamp:", error);
    return null;
  }
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
  if (!dateObj || isNaN(dateObj.getTime())) return "";

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat("en-US", defaultOptions).format(dateObj);
  } catch (error) {
    console.warn("Error formatting date:", error);
    return "";
  }
}

/**
 * Format time ago in a human-readable format
 * @param {Date|Object|string|number} timestamp - Date object, Firestore timestamp, or other date format
 * @returns {string} Human-readable time ago string
 */
export function formatTimeAgo(timestamp) {
  if (!timestamp) return "";

  try {
    // Convert Firestore timestamp if needed
    const messageTime = convertFirestoreTimestamp(timestamp);
    if (!messageTime || isNaN(messageTime.getTime())) {
      return "";
    }

    const now = new Date();
    const diffMs = now - messageTime;

    // Handle edge cases: future dates or invalid calculations
    if (diffMs < 0) return "now"; // Future dates
    if (!isFinite(diffMs)) return ""; // Invalid calculation

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Additional validation for calculated values
    if (!isFinite(diffMins) || !isFinite(diffHours) || !isFinite(diffDays)) {
      return "";
    }

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    // Safe fallback for older dates
    try {
      return formatDate(messageTime, { month: "short", day: "numeric" });
    } catch (error) {
      console.warn("Error formatting date in formatTimeAgo:", error);
      return "";
    }
  } catch (error) {
    console.warn("Error in formatTimeAgo:", error);
    return "";
  }
}

/**
 * Format time ago in a human-readable format with more detailed text
 * @param {Date|Object|string|number} timestamp - Date object, Firestore timestamp, or other date format
 * @returns {string} Human-readable time ago string
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return "";

  try {
    // Convert Firestore timestamp if needed
    const date = convertFirestoreTimestamp(timestamp);
    if (!date || isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();
    const diffMs = now - date;

    // Handle edge cases: future dates or invalid calculations
    if (diffMs < 0) return "just now"; // Future dates
    if (!isFinite(diffMs)) return ""; // Invalid calculation

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    // Additional validation for calculated values
    if (!isFinite(diffSeconds)) return "";

    if (diffSeconds < 60) return "just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffWeeks < 4)
      return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
    if (diffMonths < 12)
      return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;

    return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
  } catch (error) {
    console.warn("Error in formatRelativeTime:", error);
    return "";
  }
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

// =============================================================================
// IMAGE UTILITIES
// =============================================================================

/**
 * Validate image file type and size
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum file size in bytes (default: 5MB)
 * @returns {Object} Validation result with isValid and error message
 */
export function validateImageFile(file, maxSize = 5 * 1024 * 1024) {
  if (!file.type.startsWith("image/")) {
    return {
      isValid: false,
      error: "Please select only image files.",
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `Images must be smaller than ${maxSizeMB}MB.`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * Create image preview object with file and preview URL
 * @param {File} file - Image file
 * @returns {Object} Image object with file and preview URL
 */
export function createImagePreview(file) {
  return {
    file,
    preview: URL.createObjectURL(file),
    error: false,
    name: file.name,
  };
}

/**
 * Clean up image preview URLs to prevent memory leaks
 * @param {Array} images - Array of image objects with preview URLs
 */
export function cleanupImagePreviews(images) {
  images.forEach((image) => {
    if (image.preview) {
      URL.revokeObjectURL(image.preview);
    }
  });
}

/**
 * Process selected files for image upload
 * @param {FileList} files - Selected files from input
 * @param {number} currentCount - Current number of images
 * @param {number} maxCount - Maximum allowed images (default: 5)
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Object} Result with processed images and any error
 */
export function processImageFiles(
  files,
  currentCount = 0,
  maxCount = 5,
  maxSize = 5 * 1024 * 1024
) {
  const fileArray = Array.from(files);
  const processedImages = [];
  let error = "";

  // Check total count
  if (currentCount + fileArray.length > maxCount) {
    return {
      images: [],
      error: `Maximum ${maxCount} images allowed.`,
    };
  }

  // Process each file
  for (const file of fileArray) {
    const validation = validateImageFile(file, maxSize);

    if (!validation.isValid) {
      error = validation.error;
      break;
    }

    processedImages.push(createImagePreview(file));
  }

  return {
    images: error ? [] : processedImages,
    error: error,
  };
}
