/**
 * TypeScript Messaging Service
 * Handles messaging business logic with type safety and Zod validation
 */

import {
  createMessage,
  createConversation,
  validateId,
  validatePaginationOptions,
  ValidationError,
  Message,
  Conversation,
  PaginationOptions,
} from "../../utils/validation.utils";

const firebaseQueries = require("../../queries/FirebaseQueries");

// =================== TYPE DEFINITIONS ===================

interface UserProfile {
  uid: string;
  allow_messages?: boolean;
  [key: string]: any;
}

interface ConversationWithParticipants extends Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageWithMetadata extends Message {
  id: string;
  createdAt: string;
}

interface GetMessagesOptions extends PaginationOptions {
  startAfter?: string;
}

// =================== SERVICE CLASS ===================

class MessagingService {
  private queries: any;

  constructor() {
    this.queries = firebaseQueries;
  }

  // =================== PRIVATE HELPER METHODS ===================

  /**
   * Validate participants and check permissions
   */
  private async _validateParticipants(
    senderId: string,
    receiverId: string
  ): Promise<{
    validatedSenderId: string;
    validatedReceiverId: string;
    receiver: UserProfile;
  }> {
    try {
      const validatedSenderId = validateId(senderId);
      const validatedReceiverId = validateId(receiverId);

      if (validatedSenderId === validatedReceiverId) {
        throw new Error(
          "MESSAGE_SERVICE_ERROR: Cannot start conversation with yourself"
        );
      }

      const receiver = await this.queries.getUserById(validatedReceiverId);
      if (!receiver || !receiver.allow_messages) {
        throw new Error("MESSAGE_SERVICE_ERROR: User does not accept messages");
      }

      return { validatedSenderId, validatedReceiverId, receiver };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`MESSAGE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get existing conversation or create a new one
   */
  private async _getOrCreateConversation(
    validatedSenderId: string,
    validatedReceiverId: string
  ): Promise<ConversationWithParticipants> {
    let conversation = await this.queries.getConversationBetweenUsers(
      validatedSenderId,
      validatedReceiverId
    );

    if (!conversation) {
      const conversationData = createConversation({
        participants: [validatedSenderId, validatedReceiverId],
        unreadCount: { [validatedReceiverId]: 0, [validatedSenderId]: 0 },
      });

      const now = new Date().toISOString();
      const conversationWithMetadata = {
        ...conversationData,
        createdAt: now,
        updatedAt: now,
      };

      const conversationRef = await this.queries.createConversation(
        conversationWithMetadata
      );
      conversation = { id: conversationRef.id, ...conversationWithMetadata };
    }

    return conversation;
  }

  // =================== PUBLIC METHODS ===================

  /**
   * Start a new conversation with a user
   */
  async startConversationWithUser(
    senderId: string,
    receiverId: string,
    initialMessage?: string
  ): Promise<ConversationWithParticipants> {
    try {
      const { validatedSenderId, validatedReceiverId } =
        await this._validateParticipants(senderId, receiverId);

      const conversation = await this._getOrCreateConversation(
        validatedSenderId,
        validatedReceiverId
      );

      if (initialMessage && initialMessage.trim()) {
        await this.sendMessage(
          validatedSenderId,
          validatedReceiverId,
          initialMessage
        );
      }

      return conversation;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`MESSAGE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      throw new Error(
        `MESSAGE_SERVICE_ERROR: Failed to start conversation - ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Send a message between users
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    attachments: string[] = []
  ): Promise<MessageWithMetadata> {
    try {
      const { validatedSenderId, validatedReceiverId } =
        await this._validateParticipants(senderId, receiverId);

      const conversation = await this._getOrCreateConversation(
        validatedSenderId,
        validatedReceiverId
      );

      // Create and validate message using validation system
      const validatedMessage = createMessage({
        senderId: validatedSenderId,
        receiverId: validatedReceiverId,
        conversationId: conversation.id,
        content,
        attachments,
      });

      const messageWithMetadata = {
        ...validatedMessage,
        createdAt: new Date().toISOString(),
      };

      const messageRef = await this.queries.createMessage(messageWithMetadata);

      await this.queries.updateConversationLastMessage(
        conversation.id,
        messageWithMetadata
      );

      return { id: messageRef.id, ...messageWithMetadata };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`MESSAGE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      throw new Error(
        `MESSAGE_SERVICE_ERROR: Failed to send message - ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<ConversationWithParticipants[]> {
    try {
      const validatedUserId = validateId(userId);
      const validatedOptions = validatePaginationOptions(options);

      return await this.queries.getUserConversations(
        validatedUserId,
        validatedOptions
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`MESSAGE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      throw new Error(
        `MESSAGE_SERVICE_ERROR: Failed to get conversations - ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get messages in a conversation
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    options: GetMessagesOptions = {}
  ): Promise<MessageWithMetadata[]> {
    try {
      const validatedConversationId = validateId(conversationId);
      const validatedUserId = validateId(userId);
      const validatedOptions = validatePaginationOptions(options);

      const conversation = await this.queries.getConversationById(
        validatedConversationId
      );

      if (!conversation.participants.includes(validatedUserId)) {
        throw new Error("MESSAGE_SERVICE_UNAUTHORIZED: Access denied");
      }

      return await this.queries.getConversationMessages(
        validatedConversationId,
        validatedOptions
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`MESSAGE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      throw new Error(
        `MESSAGE_SERVICE_ERROR: Failed to get messages - ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get conversation with access validation (utility method)
   */
  async getConversationWithAccess(
    conversationId: string,
    userId: string
  ): Promise<ConversationWithParticipants | null> {
    try {
      const validatedConversationId = validateId(conversationId);
      const validatedUserId = validateId(userId);

      const conversation = await this.queries.getConversationById(
        validatedConversationId
      );

      if (!conversation) {
        return null;
      }

      if (!conversation.participants.includes(validatedUserId)) {
        throw new Error("MESSAGE_SERVICE_UNAUTHORIZED: Access denied");
      }

      return conversation;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`MESSAGE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      throw new Error(
        `MESSAGE_SERVICE_ERROR: Failed to get conversation - ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Mark conversation as read for a user
   */
  async markConversationAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      const validatedConversationId = validateId(conversationId);
      const validatedUserId = validateId(userId);

      const conversation = await this.getConversationWithAccess(
        validatedConversationId,
        validatedUserId
      );

      if (!conversation) {
        throw new Error(
          "MESSAGE_SERVICE_NOT_FOUND_ERROR: Conversation not found"
        );
      }

      await this.queries.markConversationAsRead(
        validatedConversationId,
        validatedUserId
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`MESSAGE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      throw new Error(
        `MESSAGE_SERVICE_ERROR: Failed to mark as read - ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const validatedMessageId = validateId(messageId);
      const validatedUserId = validateId(userId);

      const message = await this.queries.getMessageById(validatedMessageId);

      if (!message) {
        throw new Error("MESSAGE_SERVICE_NOT_FOUND_ERROR: Message not found");
      }

      if (message.senderId !== validatedUserId) {
        throw new Error(
          "MESSAGE_SERVICE_UNAUTHORIZED: Can only delete your own messages"
        );
      }

      await this.queries.softDeleteMessage(validatedMessageId);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`MESSAGE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      throw new Error(
        `MESSAGE_SERVICE_ERROR: Failed to delete message - ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

export const messagingService = new MessagingService();
export default messagingService;
