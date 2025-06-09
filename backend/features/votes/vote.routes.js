const express = require("express");
const router = express.Router();
const {
  authenticate,
  identify,
} = require("../../core/middleware/auth.middleware");
const votingController = require("./voting.controller");

// ==================== VOTING ROUTES ====================

/**
 * POST /api/forum/vote
 * Vote on a topic or answer
 */
router.post("/", authenticate, votingController.vote);

/**
 * GET /api/forum/votes/:targetId/:targetType
 * Get vote information (counts + user vote) for a target
 */
router.get("/:targetId/:targetType", identify, votingController.getVote);

module.exports = router;
