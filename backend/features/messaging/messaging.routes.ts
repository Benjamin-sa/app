/**
 * TypeScript Messaging Routes
 * Defines routes for messaging functionality with validation middleware
 */

import express from "express";
import { messagingController } from "./messaging.controller";
import { messagingService } from "./messaging.service";

const { authenticate } = require("../../core/middleware/auth.middleware");
const router = express.Router();

/**
 * POST /api/messages
 * Send a new message
 */
router.post(
  "/",
  authenticate,
  messagingController.validateSendMessage,
  messagingController.sendMessage
);

/**
 * POST /api/messages/start
 * Start a new conversation with a user
 */
router.post(
  "/start",
  authenticate,
  messagingController.validateStartConversation,
  messagingController.startConversation
);

/**
 * GET /api/messages/conversations
 * Get user's conversations
 */
router.get(
  "/conversations",
  authenticate,
  messagingController.validateGetConversations,
  messagingController.getConversations
);

/**
 * GET /api/messages/conversations/:conversationId
 * Get messages in a conversation
 */
router.get(
  "/conversations/:conversationId",
  authenticate,
  ...messagingController.validateGetMessages, // Spread array of middleware
  messagingController.getMessages
);

/**
 * PUT /api/messages/conversations/:conversationId/read
 * Mark conversation as read
 */
router.put(
  "/conversations/:conversationId/read",
  authenticate,
  async (req: express.Request, res: express.Response) => {
    try {
      const { conversationId } = req.params;
      const userId = (req as any).user?.uid;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      await messagingController.markMessagesAsRead(conversationId, userId);

      res.json({
        success: true,
        message: "Messages marked as read",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * DELETE /api/messages/:messageId
 * Delete a message (soft delete)
 */
router.delete(
  "/:messageId",
  authenticate,
  async (req: express.Request, res: express.Response) => {
    try {
      const { messageId } = req.params;
      const userId = (req as any).user?.uid;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      await messagingService.deleteMessage(messageId, userId);

      res.json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
