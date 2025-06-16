const express = require("express");
const router = express.Router();
const {
  authenticate,
  identify,
} = require("../../../core/middleware/auth.middleware");
const {
  uploadMultiple,
  handleUploadError,
  processImages,
  FOLDERS,
} = require("../../../core/middleware/upload.middleware");
const topicController = require("./topic.controller");

// ==================== TOPIC ROUTES ====================

/**
 * POST /api/forum/topics
 * Create a new topic with pre-uploaded images
 */
router.post(
  "/",
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
router.get("/", identify, topicController.getTopics);

/**
 * GET /api/forum/topics/:id
 * Get single topic by ID
 */
router.get("/:id", identify, topicController.getTopicById);

/**
 * PATCH /api/forum/topics/:id
 * Update a topic by ID
 */
router.patch(
  "/:id",
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
router.delete("/:id", authenticate, topicController.deleteTopic);

module.exports = router;
