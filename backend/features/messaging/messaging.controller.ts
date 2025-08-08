/**
 * TypeScript Messaging Controller
 * Handles messaging operations with type safety and Zod validation
 */

import { Request, Response } from "express";
import { z } from "zod";
import BaseController from "../../core/controller/base.controller";
import { messagingService } from "./messaging.service";
import {
  validateBody,
  validateQuery,
  Message,
  Conversation,
  ValidationError,
} from "../../utils/validation.utils";

// =================== REQUEST/RESPONSE SCHEMAS ===================

const startConversationSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  initialMessage: z.string().optional(),
});

const sendMessageSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  content: z
    .string()
    .min(1, "Message content is required")
    .max(5000, "Message too long"),
  attachments: z.array(z.string()).optional(),
});

const getConversationsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
});

const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  startAfter: z.string().optional(),
});

const conversationParamsSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
});

// =================== TYPE DEFINITIONS ===================

// Helper function to check if user is authenticated
const requireAuth = (req: Request): Express.UserAuthInfo => {
  if (!req.user) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  return req.user;
};

// =================== CONTROLLER CLASS ===================

class MessagingController extends BaseController {
  // Public handler properties for Express routes
  public startConversation: any;
  public sendMessage: any;
  public getConversations: any;
  public getMessages: any;

  constructor() {
    super("MESSAGING");

    // Wrapped public handlers with type safety
    this.startConversation = this.wrap(this._startConversation, {
      status: 201,
      op: "Start Conversation",
    });

    this.sendMessage = this.wrap(this._sendMessage, {
      status: 201,
      op: "Send Message",
    });

    this.getConversations = this.wrap(this._getConversations, {
      op: "Get Conversations",
      map: (conversations: Conversation[]) => ({ conversations }),
    });

    this.getMessages = this.wrap(this._getMessages, {
      op: "Get Messages",
      map: (messages: Message[]) => ({ messages }),
    });
  }

  // =================== PRIVATE HANDLERS ===================

  private async _startConversation(req: Request): Promise<Conversation> {
    const user = requireAuth(req);
    const { receiverId, initialMessage } = req.body;
    const senderId = user.uid;

    return messagingService.startConversationWithUser(
      senderId,
      receiverId,
      initialMessage
    );
  }

  private async _sendMessage(req: Request): Promise<Message> {
    const user = requireAuth(req);
    const { receiverId, content, attachments } = req.body;
    const senderId = user.uid;

    return messagingService.sendMessage(
      senderId,
      receiverId,
      content,
      attachments || []
    );
  }

  private async _getConversations(req: Request): Promise<Conversation[]> {
    const user = requireAuth(req);
    const userId = user.uid;
    const { limit } = req.query as { limit?: number };

    return messagingService.getUserConversations(userId, { limit });
  }

  private async _getMessages(req: Request): Promise<Message[]> {
    const user = requireAuth(req);
    const { conversationId } = req.params as { conversationId: string };
    const userId = user.uid;
    const { limit, startAfter } = req.query as {
      limit?: number;
      startAfter?: string;
    };

    return messagingService.getConversationMessages(conversationId, userId, {
      limit,
      startAfter,
    });
  }

  // =================== MIDDLEWARE VALIDATORS ===================

  public validateStartConversation = validateBody(startConversationSchema);
  public validateSendMessage = validateBody(sendMessageSchema);
  public validateGetConversations = validateQuery(getConversationsQuerySchema);
  public validateGetMessages = [
    validateQuery(getMessagesQuerySchema),
    (req: Request, res: Response, next: any) => {
      try {
        req.params = conversationParamsSchema.parse(req.params);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: `Invalid parameter: ${error.issues[0].message}`,
          });
        }
        next(error);
      }
    },
  ];

  // =================== UTILITY METHODS ===================

  /**
   * Get conversation with user validation
   */
  public async getConversationWithValidation(
    conversationId: string,
    userId: string
  ): Promise<Conversation | null> {
    try {
      return await messagingService.getConversationWithAccess(
        conversationId,
        userId
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to get conversation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Mark messages as read
   */
  public async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      await messagingService.markConversationAsRead(conversationId, userId);
    } catch (error) {
      throw new Error(
        `Failed to mark messages as read: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

export const messagingController = new MessagingController();
export default messagingController;
