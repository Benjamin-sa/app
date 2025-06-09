const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const {
  uploadMultiple,
  handleUploadError,
  processImages,
  FOLDERS,
} = require("../middleware/upload.middleware");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// Get current user info (protected route)
router.get("/me", authenticate, authController.getMe);

// Update user profile - using the upload middleware
router.put(
  "/profile",
  authenticate,
  uploadMultiple,
  processImages(FOLDERS.AVATARS), // Process avatar using the image service
  handleUploadError, // Handle any upload errors
  authController.updateProfile
);

// Sync user (create or update user profile from any auth method)
router.post("/sync", authenticate, authController.syncUser);

module.exports = router;
