const express = require("express");
const router = express.Router();
const { authenticate } = require("../../core/middleware/auth.middleware");
const messagingController = require("./messaging.controller");

/**
 * POST /api/messages
 * Send a new message
 */
router.post("/", authenticate, messagingController.sendMessage);

/**
 * GET /api/messages/conversations
 * Get user's conversations
 */
router.get(
  "/conversations",
  authenticate,
  messagingController.getConversations
);

/**
 * GET /api/messages/conversations/:conversationId
 * Get messages in a conversation
 */
router.get(
  "/conversations/:conversationId",
  authenticate,
  messagingController.getMessages
);
/**
 * POST /api/messages/start
 * Start a new conversation with a user
 */
router.post("/start", authenticate, messagingController.startConversation);

module.exports = router;
