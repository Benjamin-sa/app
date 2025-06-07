const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { uploadMultiple, handleUploadError } = require("../middleware/upload");
const { forumController } = require("../controllers");

// ==================== USER ROUTES ====================

/**
 * GET /api/forum/users/profile/:uid
 * Get user profile by UID
 */
router.get(
  "/users/profile/:uid",
  forumController.getUserProfile.bind(forumController)
);

/**
 * GET /api/forum/users/username/:username
 * Get user profile by username
 */
router.get(
  "/users/username/:username",
  forumController.getUserByUsername.bind(forumController)
);

// ==================== TOPIC ROUTES ====================

/**
 * POST /api/forum/topics
 * Create a new topic with pre-uploaded images
 */
router.post(
  "/topics",
  authenticate,
  uploadMultiple,
  forumController.createTopic.bind(forumController)
);

/**
 * GET /api/forum/topics
 * Get topics with pagination and filtering
 */
router.get("/topics", forumController.getTopics.bind(forumController));

/**
 * GET /api/forum/topics/:id
 * Get single topic by ID
 */
router.get("/topics/:id", forumController.getTopicById.bind(forumController));

/**
 * GET /api/forum/search
 * Search topics
 */
router.get("/search", forumController.searchTopics.bind(forumController));

// ==================== ANSWER ROUTES ====================

/**
 * POST /api/forum/topics/:topicId/answers
 * Create a new answer
 */
router.post(
  "/topics/:topicId/answers",
  authenticate,
  uploadMultiple,
  forumController.createAnswer.bind(forumController)
);

// ==================== VOTING ROUTES ====================

/**
 * POST /api/forum/vote
 * Vote on a topic or answer
 */
router.post("/vote", authenticate, forumController.vote.bind(forumController));

/**
 * GET /api/forum/vote/:targetId
 * Get user's vote on a specific target
 */
router.get(
  "/vote/:targetId",
  authenticate,
  forumController.getUserVote.bind(forumController)
);

// ==================== STATISTICS ROUTES ====================

/**
 * GET /api/forum/stats
 * Get forum statistics
 */
router.get("/stats", forumController.getForumStats.bind(forumController));

// ==================== ERROR HANDLING ====================

// Handle multer upload errors
router.use(handleUploadError);

// Handle general errors
router.use((error, req, res, next) => {
  console.error("Forum API Error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

module.exports = router;
