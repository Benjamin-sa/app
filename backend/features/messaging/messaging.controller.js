const BaseController = require("../../core/controller/base.controller");
const messagingService = require("./messaging.service");

class MessagingController extends BaseController {
  constructor() {
    super("MESSAGING");
  }

  async startConversation(req, res) {
    try {
      const { receiverId, initialMessage } = req.body;
      const senderId = req.user.uid;

      const conversation = await messagingService.startConversationWithUser(
        senderId,
        receiverId,
        initialMessage
      );

      return this.sendSuccess(res, conversation, 201);
    } catch (error) {
      this.handleError(res, error, "Start Conversation");
    }
  }

  async sendMessage(req, res) {
    try {
      const { receiverId, content, attachments } = req.body;
      const senderId = req.user.uid;

      const message = await messagingService.sendMessage(
        senderId,
        receiverId,
        content,
        attachments || []
      );

      return this.sendSuccess(res, message, 201);
    } catch (error) {
      this.handleError(res, error, "Send Message");
    }
  }

  async getConversations(req, res) {
    try {
      const userId = req.user.uid;
      const { limit } = req.query;

      const conversations = await messagingService.getUserConversations(
        userId,
        { limit }
      );
      return this.sendSuccess(res, { conversations });
    } catch (error) {
      this.handleError(res, error, "Get Conversations");
    }
  }

  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.uid;
      const { limit, startAfter } = req.query;

      const messages = await messagingService.getConversationMessages(
        conversationId,
        userId,
        { limit, startAfter }
      );

      return this.sendSuccess(res, { messages });
    } catch (error) {
      this.handleError(res, error, "Get Messages");
    }
  }
}

module.exports = new MessagingController();
