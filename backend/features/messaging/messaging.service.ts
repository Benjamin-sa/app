/**
 * Simplified Messaging Service
 * Clean, focused business logic for messaging
 */

import {
  MessageThread,
  Message,
  SendMessageRequest,
  GetMessagesRequest,
  ThreadListResponse,
  MessagesResponse,
} from "../../types/entities/messaging.types";

const firebaseQueries = require("../../queries/FirebaseQueries");

class MessagingService {
  private queries: any;

  constructor() {
    this.queries = firebaseQueries;
  }

  /**
   * Send a message - creates thread if needed
   */
  async sendMessage(
    senderId: string,
    request: SendMessageRequest
  ): Promise<Message> {
    const { receiverId, content } = request;

    if (senderId === receiverId) {
      throw new Error("Cannot send message to yourself");
    }

    if (!content.trim() || content.length > 5000) {
      throw new Error("Invalid message content");
    }

    // Get or create thread
    const thread = await this.getOrCreateThread(senderId, receiverId);

    // Create message
    const message: Message = {
      id: this.generateId(),
      threadId: thread.id,
      senderId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      isDeleted: false,
      readBy: [senderId], // Sender has "read" their own message
    };

    // Save message and update thread
    await Promise.all([
      this.saveMessage(message),
      this.updateThreadAfterMessage(thread.id, message),
    ]);

    return message;
  }

  /**
   * Get user's message threads
   */
  async getUserThreads(
    userId: string,
    limit = 20
  ): Promise<ThreadListResponse> {
    const threads = await this.queries.getUserThreads(userId, limit + 1);

    return {
      threads: threads.slice(0, limit),
      hasMore: threads.length > limit,
    };
  }

  /**
   * Get messages in a thread
   */
  async getThreadMessages(
    userId: string,
    request: GetMessagesRequest
  ): Promise<MessagesResponse> {
    const { threadId, limit = 50, before } = request;

    // Verify user has access to thread
    const thread = await this.queries.getThreadById(threadId);
    if (!thread || !thread.participants.includes(userId)) {
      throw new Error("Thread not found or access denied");
    }

    const messages = await this.queries.getThreadMessages(
      threadId,
      limit + 1,
      before
    );

    return {
      messages: messages.slice(0, limit),
      hasMore: messages.length > limit,
    };
  }

  /**
   * Mark thread as read for user
   */
  async markThreadAsRead(userId: string, threadId: string): Promise<void> {
    const thread = await this.queries.getThreadById(threadId);
    if (!thread || !thread.participants.includes(userId)) {
      throw new Error("Thread not found or access denied");
    }

    // Get unread messages and mark them as read
    const unreadMessages = await this.queries.getUnreadMessages(
      threadId,
      userId
    );

    if (unreadMessages.length > 0) {
      await Promise.all([
        // Mark messages as read
        this.queries.markMessagesAsRead(
          unreadMessages.map((m: any) => m.id),
          userId
        ),
        // Reset unread counter
        this.queries.resetUnreadCounter(threadId, userId),
      ]);
    }
  }

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.queries.getMessageById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== userId) {
      throw new Error("Can only delete your own messages");
    }

    await this.queries.softDeleteMessage(messageId);
  }

  // Private helper methods

  private async getOrCreateThread(
    userId1: string,
    userId2: string
  ): Promise<MessageThread> {
    // Always order participants consistently for lookups
    const participants: [string, string] =
      userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    let thread = await this.queries.getThreadByParticipants(participants);

    if (!thread) {
      thread = {
        id: this.generateId(),
        participants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        unreadCounts: {
          [userId1]: 0,
          [userId2]: 0,
        },
      };

      await this.queries.createThread(thread);
    }

    return thread;
  }

  private async updateThreadAfterMessage(
    threadId: string,
    message: Message
  ): Promise<void> {
    const receiverId = await this.getOtherParticipant(
      threadId,
      message.senderId
    );

    await this.queries.updateThread(threadId, {
      lastMessageId: message.id,
      lastMessageContent: message.content.substring(0, 100), // Preview
      lastMessageSentBy: message.senderId,
      lastMessageAt: message.createdAt,
      updatedAt: message.createdAt,
      [`unreadCounts.${receiverId}`]: this.incrementCounter(1), // Firestore increment
    });
  }

  private async getOtherParticipant(
    threadId: string,
    userId: string
  ): Promise<string> {
    const thread = await this.queries.getThreadById(threadId);
    return thread.participants.find((p: any) => p !== userId)!;
  }

  private async saveMessage(message: Message): Promise<void> {
    await this.queries.createMessage(message);
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private incrementCounter(value: number) {
    // Return Firestore increment operation
    return { _increment: value };
  }
}

export const messagingService = new MessagingService();
export default messagingService;
