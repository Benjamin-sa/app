/**
 * Simplified Messaging Controller
 * Clean, focused HTTP handlers extending BaseController
 */

import { Request, Response } from "express";
import BaseController from "../../core/controller/base.controller";
import { messagingService } from "./messaging.service";
import {
  SendMessageRequest,
  GetMessagesRequest,
  ThreadListResponse,
  MessagesResponse,
  Message,
  MessageThread,
} from "../../types/entities/messaging.types";

// Helper function to check if user is authenticated
const requireAuth = (req: Request): Express.UserAuthInfo => {
  if (!req.user) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  return req.user;
};

class MessagingController extends BaseController {
  // Public handler properties for Express routes
  public sendMessage: any;
  public getThreads: any;
  public getMessages: any;
  public markAsRead: any;
  public deleteMessage: any;

  constructor() {
    super("MESSAGING");

    // Wrapped public handlers with type safety using BaseController's wrap method
    this.sendMessage = this.wrap(this._sendMessage, {
      status: 201,
      op: "Send Message",
    });

    this.getThreads = this.wrap(this._getThreads, {
      op: "Get Threads",
    });

    this.getMessages = this.wrap(this._getMessages, {
      op: "Get Messages",
    });

    this.markAsRead = this.wrap(this._markAsRead, {
      op: "Mark Thread As Read",
      message: "Thread marked as read",
    });

    this.deleteMessage = this.wrap(this._deleteMessage, {
      op: "Delete Message",
      message: "Message deleted successfully",
    });
  }

  // =================== PRIVATE HANDLERS ===================

  private async _sendMessage(req: Request): Promise<Message> {
    const user = requireAuth(req);
    const senderId = user.uid;
    const request: SendMessageRequest = req.body;

    return messagingService.sendMessage(senderId, request);
  }

  private async _getThreads(req: Request): Promise<ThreadListResponse> {
    const user = requireAuth(req);
    const userId = user.uid;
    const limit = parseInt(req.query.limit as string) || 20;

    return messagingService.getUserThreads(userId, limit);
  }

  private async _getMessages(req: Request): Promise<MessagesResponse> {
    const user = requireAuth(req);
    const userId = user.uid;
    const { threadId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string;

    const request: GetMessagesRequest = { threadId, limit, before };
    return messagingService.getThreadMessages(userId, request);
  }

  private async _markAsRead(req: Request): Promise<void> {
    const user = requireAuth(req);
    const userId = user.uid;
    const { threadId } = req.params;

    await messagingService.markThreadAsRead(userId, threadId);
  }

  private async _deleteMessage(req: Request): Promise<void> {
    const user = requireAuth(req);
    const userId = user.uid;
    const { messageId } = req.params;

    await messagingService.deleteMessage(userId, messageId);
  }
}

export const messagingController = new MessagingController();
export default messagingController;
