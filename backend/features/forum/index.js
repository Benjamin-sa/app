const express = require("express");
const router = express.Router();

// Import feature routes
const userRoutes = require("../auth/user.routes");
const topicRoutes = require("./topics/topic.routes");
const answerRoutes = require("./answers/answer.routes");
const voteRoutes = require("../votes/vote.routes");

// Mount routes with appropriate prefixes
router.use("/users", userRoutes);
router.use("/topics", topicRoutes);
router.use("/answers", answerRoutes);
router.use("/vote", voteRoutes);
router.use("/votes", voteRoutes);

// Add search route (mounted directly since it's a special case)
const topicController = require("../forum/topics/topic.controller");
router.get("/search", topicController.searchTopics);

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
