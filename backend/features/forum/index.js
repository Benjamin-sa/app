const express = require("express");
const router = express.Router();

// Import feature routes
const userRoutes = require("../auth/user.routes");
const topicRoutes = require("./topics/topic.routes");
const answerRoutes = require("./answers/answer.routes");

// Mount routes with appropriate prefixes
router.use("/users", userRoutes);
router.use("/topics", topicRoutes);
router.use("/answers", answerRoutes);

// Add search route (mounted directly since it's a special case)
const topicController = require("../forum/topics/topic.controller");
const { identify } = require("../../core/middleware/auth.middleware");
router.get("/search", identify, topicController.searchTopics);

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
