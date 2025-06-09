const express = require("express");
const router = express.Router();
const { authenticate, identify } = require("../middleware/auth.middleware");
const {
  uploadMultiple,
  handleUploadError,
  processImages,
  FOLDERS,
} = require("../middleware/upload.middleware");

// Import individual controllers
const userController = require("../controllers/forum/user.controller");
const topicController = require("../controllers/forum/topic.controller");
const answerController = require("../controllers/forum/answer.controller");
const votingController = require("../controllers/forum/voting.controller");
const statsController = require("../controllers/forum/stats.controller");

// ==================== USER ROUTES ====================

/**
 * GET /api/forum/users/profile/:uid
 * Get user profile by UID
 */
router.get("/users/profile/:uid", userController.getUserProfile);

/**
 * GET /api/forum/users/username/:username
 * Get user profile by username
 */
router.get("/users/username/:username", userController.getUserByUsername);

// ==================== TOPIC ROUTES ====================

/**
 * POST /api/forum/topics
 * Create a new topic with pre-uploaded images
 */
router.post(
  "/topics",
  authenticate,
  uploadMultiple,
  processImages(FOLDERS.TOPICS),
  handleUploadError,
  (req, res) => topicController.topicOperation(req, res, "create")
);

/**
 * GET /api/forum/topics
 * Get topics with pagination and filtering
 */
router.get("/topics", authenticate, topicController.getTopics);

/**
 * GET /api/forum/topics/:id
 * Get single topic by ID
 */
router.get("/topics/:id", topicController.getTopicById);

/**
 * GET /api/forum/search
 * Search topics
 */
router.get("/search", topicController.searchTopics);

/**
 * PATCH /api/forum/topics/:id
 * Update a topic by ID
 */
router.patch(
  "/topics/:id",
  authenticate,
  uploadMultiple,
  processImages(FOLDERS.TOPICS),
  handleUploadError,
  (req, res) => topicController.topicOperation(req, res, "update")
);

/**
 * DELETE /api/forum/topics/:id
 * Delete a topic by ID
 */
router.delete("/topics/:id", authenticate, topicController.deleteTopic);

// ==================== ANSWER ROUTES ====================

/**
 * POST /api/forum/topics/:topicId/answers
 * Create a new answer
 */
router.post(
  "/topics/:topicId/answers",
  authenticate,
  uploadMultiple,
  processImages(FOLDERS.ANSWERS),
  handleUploadError,
  answerController.createAnswer
);

/**
 * PATCH /api/forum/answers/:id
 * Update an answer by ID
 */
router.patch(
  "/answers/:answerId",
  authenticate,
  uploadMultiple,
  processImages(FOLDERS.ANSWERS),
  handleUploadError,
  answerController.updateAnswer
);

/**
 * DELETE /api/forum/answers/:id
 * Delete an answer by ID
 */
router.delete("/answers/:id", authenticate, answerController.deleteAnswer);

/**
 * GET /api/forum/topics/:topicId/answers
 * Get answers for a specific topic
 */
router.get("/topics/:topicId/answers", answerController.getAnswersByTopic);

// ==================== VOTING ROUTES ====================

/**
 * POST /api/forum/vote
 * Vote on a topic or answer
 */
router.post("/vote", authenticate, votingController.vote);

/**
 * GET /api/forum/votes/:targetId/:targetType
 * Get vote information (counts + user vote) for a target
 */
router.get("/votes/:targetId/:targetType", identify, votingController.getVote);

// ==================== STATISTICS ROUTES ====================

/**
 * GET /api/forum/stats
 * Get forum statistics
 */
router.get("/stats", statsController.getForumStats);

// ==================== ERROR HANDLING ====================

// Handle general errors
router.use((error, req, res, next) => {
  console.error("Forum API Error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

module.exports = router;
