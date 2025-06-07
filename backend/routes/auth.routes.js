const express = require("express");
const multer = require("multer");
const authenticate = require("../middleware/auth");
const { authController } = require("../controllers");

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Register new user
router.post("/register", authController.register.bind(authController));

// Login (Firebase handles authentication client-side, this is for server-side validation)
// Login (Firebase handles authentication client-side, this is for server-side validation)
router.post("/login", authController.login.bind(authController));

// Get current user info (protected route)
router.get("/me", authenticate, authController.getMe.bind(authController));

// Update user profile
router.put(
  "/profile",
  authenticate,
  authController.updateProfile.bind(authController)
);

// Upload avatar endpoint
router.post(
  "/avatar",
  authenticate,
  upload.single("avatar"),
  authController.uploadAvatar.bind(authController)
);

// Verify email
router.post(
  "/verify-email",
  authenticate,
  authController.verifyEmail.bind(authController)
);

// Sync user (create or update user profile from any auth method)
router.post(
  "/sync",
  authenticate,
  authController.syncUser.bind(authController)
);

module.exports = router;
