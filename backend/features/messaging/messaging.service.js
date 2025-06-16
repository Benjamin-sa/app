const firebaseQueries = require("../../queries/FirebaseQueries");
const { Message, Conversation } = require("../../models/forum.models");
const ValidationUtils = require("../../utils/validation.utils");
const htmlSanitizerService = require("../../core/services/htmlSanitizer.service");

class MessagingService {
  constructor() {
    this.queries = firebaseQueries;
  }

  async startConversationWithUser(senderId, receiverId, initialMessage = null) {
    try {
      ValidationUtils.required(
        { senderId, receiverId },
        "MESSAGE",
        "start conversation"
      );

      if (senderId === receiverId) {
        throw new Error(
          "MESSAGE_SERVICE_ERROR: Cannot start conversation with yourself"
        );
      }

      // Check if receiver allows messages
      const receiver = await this.queries.getUserById(receiverId);
      if (!receiver || !receiver.allow_messages) {
        throw new Error("MESSAGE_SERVICE_ERROR: User does not accept messages");
      }

      // Check if conversation already exists
      let conversation = await this.queries.getConversationBetweenUsers(
        senderId,
        receiverId
      );

      if (!conversation) {
        // Create new conversation
        const conversationData = {
          ...Conversation,
          participants: [senderId, receiverId],
          unreadCount: { [receiverId]: 0, [senderId]: 0 },
        };
        const conversationRef = await this.queries.createConversation(
          conversationData
        );
        conversation = { id: conversationRef.id, ...conversationData };
      }

      // Send initial message if provided
      if (initialMessage && initialMessage.trim()) {
        await this.sendMessage(senderId, receiverId, initialMessage);
      }

      return conversation;
    } catch (error) {
      throw new Error(
        `MESSAGE_SERVICE_ERROR: Failed to start conversation - ${error.message}`
      );
    }
  }

  async sendMessage(senderId, receiverId, content, attachments = []) {
    try {
      ValidationUtils.required(
        { senderId, receiverId, content },
        "MESSAGE",
        "send message"
      );

      // Check if receiver allows messages
      const receiver = await this.queries.getUserById(receiverId);

      if (!receiver.allow_messages) {
        throw new Error("MESSAGE_SERVICE_ERROR: User does not accept messages");
      }

      // Get or create conversation
      let conversation = await this.queries.getConversationBetweenUsers(
        senderId,
        receiverId
      );

      if (!conversation) {
        const conversationData = {
          ...Conversation,
          participants: [senderId, receiverId],
          unreadCount: { [receiverId]: 0 },
        };
        const conversationRef = await this.queries.createConversation(
          conversationData
        );
        conversation = { id: conversationRef.id, ...conversationData };
      }

      // Create message
      const messageData = {
        ...Message,
        senderId,
        receiverId,
        conversationId: conversation.id,
        content: htmlSanitizerService.sanitizeForumContent(content),
        attachments,
      };

      const messageRef = await this.queries.createMessage(messageData);

      // Update conversation
      await this.queries.updateConversationLastMessage(
        conversation.id,
        messageData
      );

      return { id: messageRef.id, ...messageData };
    } catch (error) {
      throw new Error(
        `MESSAGE_SERVICE_ERROR: Failed to send message - ${error.message}`
      );
    }
  }

  async getUserConversations(userId, options = {}) {
    try {
      ValidationUtils.required({ userId }, "MESSAGE", "get conversations");
      return await this.queries.getUserConversations(userId, options);
    } catch (error) {
      throw new Error(
        `MESSAGE_SERVICE_ERROR: Failed to get conversations - ${error.message}`
      );
    }
  }

  async getConversationMessages(conversationId, userId, options = {}) {
    try {
      ValidationUtils.required(
        { conversationId, userId },
        "MESSAGE",
        "get messages"
      );

      // Verify user is participant
      const conversation = await this.queries.getConversationById(
        conversationId
      );
      if (!conversation.participants.includes(userId)) {
        throw new Error("MESSAGE_SERVICE_UNAUTHORIZED: Access denied");
      }

      return await this.queries.getConversationMessages(
        conversationId,
        options
      );
    } catch (error) {
      throw new Error(
        `MESSAGE_SERVICE_ERROR: Failed to get messages - ${error.message}`
      );
    }
  }
}

module.exports = new MessagingService();
