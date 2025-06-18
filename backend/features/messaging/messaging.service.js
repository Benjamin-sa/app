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

  async startConversationWithUser(senderId, receiverId, initialMessage = null) {
    try {
      // Validate required parameters
      const validatedSenderId = validateId(senderId, "senderId");
      const validatedReceiverId = validateId(receiverId, "receiverId");

      if (validatedSenderId === validatedReceiverId) {
        throw new Error(
          "MESSAGE_SERVICE_ERROR: Cannot start conversation with yourself"
        );
      }

      // Check if receiver allows messages
      const receiver = await this.queries.getUserById(validatedReceiverId);
      if (!receiver || !receiver.allow_messages) {
        throw new Error("MESSAGE_SERVICE_ERROR: User does not accept messages");
      }

      // Check if conversation already exists
      let conversation = await this.queries.getConversationBetweenUsers(
        validatedSenderId,
        validatedReceiverId
      );

      if (!conversation) {
        // Create new conversation using validation system
        const conversationData = createConversation({
          participants: [validatedSenderId, validatedReceiverId],
          unreadCount: { [validatedReceiverId]: 0, [validatedSenderId]: 0 },
        });

        conversationData.createdAt = new Date().toISOString();
        conversationData.updatedAt = new Date().toISOString();

        const conversationRef = await this.queries.createConversation(
          conversationData
        );
        conversation = { id: conversationRef.id, ...conversationData };
      }

      // Send initial message if provided
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
      // Validate required parameters
      const validatedSenderId = validateId(senderId, "senderId");
      const validatedReceiverId = validateId(receiverId, "receiverId");

      // Create and validate message using validation system
      const validatedMessage = createMessage({
        senderId: validatedSenderId,
        receiverId: validatedReceiverId,
        content,
        attachments,
      });

      // Check if receiver allows messages
      const receiver = await this.queries.getUserById(validatedReceiverId);
      if (!receiver.allow_messages) {
        throw new Error("MESSAGE_SERVICE_ERROR: User does not accept messages");
      }

      // Get or create conversation
      let conversation = await this.queries.getConversationBetweenUsers(
        validatedSenderId,
        validatedReceiverId
      );

      if (!conversation) {
        const conversationData = createConversation({
          participants: [validatedSenderId, validatedReceiverId],
          unreadCount: { [validatedReceiverId]: 0 },
        });

        conversationData.createdAt = new Date().toISOString();
        conversationData.updatedAt = new Date().toISOString();

        const conversationRef = await this.queries.createConversation(
          conversationData
        );
        conversation = { id: conversationRef.id, ...conversationData };
      }

      // Add conversation ID and timestamps
      validatedMessage.conversationId = conversation.id;
      validatedMessage.createdAt = new Date().toISOString();

      const messageRef = await this.queries.createMessage(validatedMessage);

      // Update conversation
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
      // Validate userId and pagination options
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
      // Validate required parameters
      const validatedConversationId = validateId(
        conversationId,
        "conversationId"
      );
      const validatedUserId = validateId(userId, "userId");
      const validatedOptions = validatePaginationOptions(options);

      // Verify user is participant
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
