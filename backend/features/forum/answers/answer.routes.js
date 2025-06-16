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
const answerController = require("./answer.controller");

// ==================== ANSWER ROUTES ====================

/**
 * POST /api/forum/answers/:topicId
 * Create a new answer
 */
router.post(
  "/:topicId",
  authenticate,
  uploadMultiple,
  processImages(FOLDERS.ANSWERS),
  handleUploadError,
  answerController.createAnswer
);

/**
 * PATCH /api/forum/answers/:answerId
 * Update an answer by ID
 */
router.patch(
  "/:answerId",
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
router.delete("/:id", authenticate, answerController.deleteAnswer);

/**
 * GET /api/forum/answers/:topicId
 * Get answers for a specific topic
 */
router.get("/:topicId", identify, answerController.getAnswersByTopic);

module.exports = router;
