/**
 * Multer configuration for file uploads
 * Handles multipart/form-data for image uploads
 */

const multer = require("multer");

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed."
      ),
      false
    );
  }
};

// Configure upload limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // Maximum 5 files per request
  },
});

// Middleware for single image upload
const uploadSingle = upload.single("image");

// Middleware for multiple image uploads
const uploadMultiple = upload.array("images", 5);

// Error handler for multer errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        message: "File size must be less than 5MB",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Too many files",
        message: "Maximum 5 files allowed per request",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Unexpected field",
        message: "Unexpected file field in request",
      });
    }
  }

  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({
      error: "Invalid file type",
      message: error.message,
    });
  }

  // Pass other errors to the next error handler
  next(error);
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  handleUploadError,
};
