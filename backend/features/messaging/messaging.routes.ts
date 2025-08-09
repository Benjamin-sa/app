/**
 * Simplified Messaging Routes
 * Clean route definitions using the updated controller
 */

import express from "express";
import { messagingController } from "./messaging.controller";

const { authenticate } = require("../../core/middleware/auth.middleware");
const router = express.Router();

/**
 * POST /api/messages
 * Send a message
 * Body: { receiverId: string, content: string }
 */
router.post("/", authenticate, messagingController.sendMessage);

/**
 * GET /api/messages/threads
 * Get user's message threads
 * Query: ?limit=20
 */
router.get("/threads", authenticate, messagingController.getThreads);

/**
 * GET /api/messages/threads/:threadId
 * Get messages in a thread
 * Query: ?limit=50&before=messageId
 */
router.get("/threads/:threadId", authenticate, messagingController.getMessages);

/**
 * PUT /api/messages/threads/:threadId/read
 * Mark thread as read
 */
router.put(
  "/threads/:threadId/read",
  authenticate,
  messagingController.markAsRead
);

/**
 * DELETE /api/messages/:messageId
 * Delete a message
 */
router.delete("/:messageId", authenticate, messagingController.deleteMessage);

export default router;
