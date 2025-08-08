const firebaseQueries = require("../../queries/FirebaseQueries");
const { Message, Conversation } = require("../../models/forum.models");
const {
  createMessage,
  createConversation,
  ValidationError,
  validateId,
  validatePaginationOptions,
} = require("../../utils/validation.utils");

class MessagingService {
  constructor() {
    this.queries = firebaseQueries;
  }

  // Helper: validate participants and permissions
  async _validateParticipants(senderId, receiverId) {
    const validatedSenderId = validateId(senderId, "senderId");
    const validatedReceiverId = validateId(receiverId, "receiverId");

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
  }

  // Helper: get existing conversation or create a new one
  async _getOrCreateConversation(validatedSenderId, validatedReceiverId) {
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
      conversationData.createdAt = now;
      conversationData.updatedAt = now;

      const conversationRef = await this.queries.createConversation(
        conversationData
      );
      conversation = { id: conversationRef.id, ...conversationData };
    }

    return conversation;
  }

  async startConversationWithUser(senderId, receiverId, initialMessage = null) {
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
        `MESSAGE_SERVICE_ERROR: Failed to start conversation - ${error.message}`
      );
    }
  }

  async sendMessage(senderId, receiverId, content, attachments = []) {
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

      validatedMessage.createdAt = new Date().toISOString();

      const messageRef = await this.queries.createMessage(validatedMessage);

      await this.queries.updateConversationLastMessage(
        conversation.id,
        validatedMessage
      );

      return { id: messageRef.id, ...validatedMessage };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`MESSAGE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      throw new Error(
        `MESSAGE_SERVICE_ERROR: Failed to send message - ${error.message}`
      );
    }
  }

  async getUserConversations(userId, options = {}) {
    try {
      const validatedUserId = validateId(userId, "userId");
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
        `MESSAGE_SERVICE_ERROR: Failed to get conversations - ${error.message}`
      );
    }
  }

  async getConversationMessages(conversationId, userId, options = {}) {
    try {
      const validatedConversationId = validateId(
        conversationId,
        "conversationId"
      );
      const validatedUserId = validateId(userId, "userId");
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
        `MESSAGE_SERVICE_ERROR: Failed to get messages - ${error.message}`
      );
    }
  }
}

module.exports = new MessagingService();
