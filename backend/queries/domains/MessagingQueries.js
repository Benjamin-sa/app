/**
 * Messaging Queries
 * Handles all messaging-related Firebase operations (Conversations + Messages)
 */

const BaseFirebaseQueries = require("../base/BaseFirebaseQueries");
const { COLLECTIONS } = require("../../models/forum.models");

class MessagingQueries extends BaseFirebaseQueries {
  // =====================
  // CONVERSATION OPERATIONS
  // =====================

  /**
   * Create a new conversation
   */
  async createConversation(conversationData) {
    return await this.createDocument(
      COLLECTIONS.CONVERSATIONS,
      conversationData,
      "Failed to create conversation"
    );
  }

  /**
   * Get conversation between two users
   */
  async getConversationBetweenUsers(userId1, userId2) {
    return await this.executeQuery(async () => {
      const snapshot = await this.db
        .collection(COLLECTIONS.CONVERSATIONS)
        .where("participants", "array-contains", userId1)
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.participants.includes(userId2)) {
          return { id: doc.id, ...data };
        }
      }
      return null;
    }, "Failed to get conversation");
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId) {
    return await this.executeQuery(async () => {
      const doc = await this.db
        .collection(COLLECTIONS.CONVERSATIONS)
        .doc(conversationId.trim())
        .get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }, "Failed to get conversation by ID");
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId, options = {}) {
    return await this.executeQuery(async () => {
      const { limit = 20 } = options;

      const snapshot = await this.db
        .collection(COLLECTIONS.CONVERSATIONS)
        .where("participants", "array-contains", userId)
        .orderBy("lastMessageAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }, "Failed to get user conversations");
  }

  /**
   * Update conversation last message
   */
  async updateConversationLastMessage(conversationId, messageData) {
    return await this.executeQuery(async () => {
      await this.db
        .collection(COLLECTIONS.CONVERSATIONS)
        .doc(conversationId)
        .update({
          lastMessage: messageData.content,
          lastMessageAt: this.FieldValue.serverTimestamp(),
          lastMessageBy: messageData.senderId,
          updatedAt: this.FieldValue.serverTimestamp(),
        });
    }, "Failed to update conversation");
  }

  // =====================
  // MESSAGE OPERATIONS
  // =====================

  /**
   * Create a new message
   */
  async createMessage(messageData) {
    return await this.executeQuery(async () => {
      const docRef = this.db.collection(COLLECTIONS.MESSAGES).doc();
      const cleanData = {
        ...messageData,
        id: docRef.id,
        createdAt: this.FieldValue.serverTimestamp(),
      };
      await docRef.set(cleanData);
      return docRef;
    }, "Failed to create message");
  }

  /**
   * Get messages in conversation
   */
  async getConversationMessages(conversationId, options = {}) {
    return await this.executeQuery(async () => {
      const { limit = 50, startAfter } = options;

      let query = this.db
        .collection(COLLECTIONS.MESSAGES)
        .where("conversationId", "==", conversationId)
        .orderBy("createdAt", "desc")
        .limit(limit);

      if (startAfter) {
        query = query.startAfter(startAfter);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }, "Failed to get conversation messages");
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId) {
    return await this.executeQuery(async () => {
      await this.db.collection(COLLECTIONS.MESSAGES).doc(messageId).update({
        readAt: this.FieldValue.serverTimestamp(),
      });
    }, "Failed to mark message as read");
  }
}

module.exports = MessagingQueries;
