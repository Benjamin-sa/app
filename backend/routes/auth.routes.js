const express = require("express");
const multer = require("multer");
const authenticate = require("../middleware/auth");
const { authController } = require("../controllers");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Get current user info (protected route)
router.get("/me", authenticate, authController.getMe.bind(authController));

// Update user profile - NOW WITH FILE UPLOAD SUPPORT
router.put(
  "/profile",
  authenticate,
  upload.single("avatar"), // Add multer middleware for avatar upload
  authController.updateProfile.bind(authController)
);

// Sync user (create or update user profile from any auth method)
router.post(
  "/sync",
  authenticate,
  authController.syncUser.bind(authController)
);

module.exports = router;
