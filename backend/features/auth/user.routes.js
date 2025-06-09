const express = require("express");
const router = express.Router();
const userController = require("./user.controller");

// ==================== USER ROUTES ====================

/**
 * GET /api/forum/users/profile/:uid
 * Get user profile by UID
 */
router.get("/profile/:uid", userController.getUserProfile);

/**
 * GET /api/forum/users/username/:username
 * Get user profile by username
 */
router.get("/username/:username", userController.getUserByUsername);

module.exports = router;
