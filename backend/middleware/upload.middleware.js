/**
 * Multer configuration for file uploads
 * Handles multipart/form-data for image uploads
 */

const multer = require("multer");
const imageService = require("../services/image.service");

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Define folder constants for different image types
const FOLDERS = {
  TOPICS: "forum/topics",
  ANSWERS: "forum/answers",
  AVATARS: "forum/avatars",
  BIKES: "bikes",
};

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

// Only keep what you actually use: multiple file uploads
const uploadMultiple = upload.array("images", 5);

// Error handler for multer errors - THIS IS USED in your routes!
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

/**
 * Middleware to process images and convert them to image data
 * Use this after uploadMultiple or upload.single middleware
 * @param {string} folder - Storage folder path (e.g., 'forum/topics', 'forum/avatars', 'forum/answers')
 */
const processImages = (folder = "forum/images") => {
  return async (req, res, next) => {
    try {
      // Handle single file (like avatar)
      if (req.file) {
        console.log(`Processing single image for upload to ${folder}`);

        const uploadedImage = await imageService.uploadImages(req.file, folder);

        req.imageData = uploadedImage;
        delete req.file; // Remove raw file data

        console.log(
          `Successfully processed single image with imageData:`,
          req.imageData
        );
        return next();
      }

      // Handle multiple files
      if (!req.files || req.files.length === 0) {
        req.imageData = [];
        return next();
      }

      console.log(
        `Processing ${req.files.length} image(s) for upload to ${folder}`
      );

      // Upload images using image service
      const uploadedImages = await imageService.uploadImages(req.files, folder);

      // Replace req.files with processed image data
      req.imageData = uploadedImages;
      delete req.files; // Remove raw file data

      console.log(`Successfully processed ${uploadedImages.length} image(s)`);
      next();
    } catch (error) {
      console.error("Image processing error:", error.message);

      // Send user-friendly error response
      return res.status(400).json({
        error: "Image processing failed",
        message: error.message.includes("IMAGE_SERVICE_")
          ? error.message.split("IMAGE_SERVICE_")[1].split(":")[1].trim()
          : "Failed to process uploaded images",
      });
    }
  };
};

// Only export what you actually use
module.exports = {
  upload,
  uploadMultiple,
  handleUploadError,
  processImages,
  FOLDERS,
};
