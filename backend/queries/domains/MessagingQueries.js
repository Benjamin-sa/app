/**
 * Simplified Messaging Queries
 * Handles all messaging-related Firebase operations (Threads + Messages)
 */

const BaseFirebaseQueries = require("../base/BaseFirebaseQueries");
const { COLLECTIONS } = require("../../models/forum.models");

class MessagingQueries extends BaseFirebaseQueries {
  // =====================
  // THREAD OPERATIONS (Simplified Conversations)
  // =====================

  /**
   * Create a new thread
   */
  async createThread(threadData) {
    return await this.createDocument(
      COLLECTIONS.THREADS || COLLECTIONS.CONVERSATIONS, // Fallback to conversations if threads collection doesn't exist
      threadData,
      "Failed to create thread"
    );
  }

  /**
   * Get thread by ID
   */
  async getThreadById(threadId) {
    return await this.executeQuery(async () => {
      const doc = await this.db
        .collection(COLLECTIONS.THREADS || COLLECTIONS.CONVERSATIONS)
        .doc(threadId.trim())
        .get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }, "Failed to get thread by ID");
  }

  /**
   * Get thread by participants (always ordered)
   */
  async getThreadByParticipants(participants) {
    return await this.executeQuery(async () => {
      const snapshot = await this.db
        .collection(COLLECTIONS.THREADS || COLLECTIONS.CONVERSATIONS)
        .where("participants", "==", participants)
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }, "Failed to get thread by participants");
  }

  /**
   * Get user threads
   */
  async getUserThreads(userId, limit = 20) {
    return await this.executeQuery(async () => {
      const snapshot = await this.db
        .collection(COLLECTIONS.THREADS || COLLECTIONS.CONVERSATIONS)
        .where("participants", "array-contains", userId)
        .orderBy("updatedAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }, "Failed to get user threads");
  }

  /**
   * Update thread with new message info and unread counts
   */
  async updateThread(threadId, updates) {
    return await this.executeQuery(async () => {
      // Handle Firestore increment operations
      const processedUpdates = { ...updates };
      Object.keys(processedUpdates).forEach((key) => {
        if (processedUpdates[key]?._increment) {
          processedUpdates[key] = this.FieldValue.increment(
            processedUpdates[key]._increment
          );
        }
      });

      await this.db
        .collection(COLLECTIONS.THREADS || COLLECTIONS.CONVERSATIONS)
        .doc(threadId)
        .update(processedUpdates);
    }, "Failed to update thread");
  }

  /**
   * Reset unread counter for a user in a thread
   */
  async resetUnreadCounter(threadId, userId) {
    return await this.executeQuery(async () => {
      await this.db
        .collection(COLLECTIONS.THREADS || COLLECTIONS.CONVERSATIONS)
        .doc(threadId)
        .update({
          [`unreadCounts.${userId}`]: 0,
        });
    }, "Failed to reset unread counter");
  }

  // =====================
  // MESSAGE OPERATIONS
  // =====================

  /**
   * Create a new message
   */
  async createMessage(messageData) {
    return await this.executeQuery(async () => {
      const docRef = this.db
        .collection(COLLECTIONS.MESSAGES)
        .doc(messageData.id);
      const cleanData = {
        ...messageData,
        createdAt: this.FieldValue.serverTimestamp(),
      };
      await docRef.set(cleanData);
      return docRef;
    }, "Failed to create message");
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId) {
    return await this.executeQuery(async () => {
      const doc = await this.db
        .collection(COLLECTIONS.MESSAGES)
        .doc(messageId)
        .get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }, "Failed to get message by ID");
  }

  /**
   * Get messages in thread
   */
  async getThreadMessages(threadId, limit = 50, before) {
    return await this.executeQuery(async () => {
      let query = this.db
        .collection(COLLECTIONS.MESSAGES)
        .where("threadId", "==", threadId)
        .where("isDeleted", "==", false)
        .orderBy("createdAt", "desc")
        .limit(limit);

      if (before) {
        const beforeDoc = await this.db
          .collection(COLLECTIONS.MESSAGES)
          .doc(before)
          .get();
        if (beforeDoc.exists) {
          query = query.startAfter(beforeDoc);
        }
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }, "Failed to get thread messages");
  }

  /**
   * Get unread messages for a user in a thread
   */
  async getUnreadMessages(threadId, userId) {
    return await this.executeQuery(async () => {
      const snapshot = await this.db
        .collection(COLLECTIONS.MESSAGES)
        .where("threadId", "==", threadId)
        .where("isDeleted", "==", false)
        .get();

      // Filter messages not read by this user
      const unreadMessages = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!data.readBy || !data.readBy.includes(userId)) {
          unreadMessages.push({ id: doc.id, ...data });
        }
      });

      return unreadMessages;
    }, "Failed to get unread messages");
  }

  /**
   * Mark multiple messages as read by a user
   */
  async markMessagesAsRead(messageIds, userId) {
    return await this.executeQuery(async () => {
      const batch = this.db.batch();

      messageIds.forEach((messageId) => {
        const messageRef = this.db
          .collection(COLLECTIONS.MESSAGES)
          .doc(messageId);
        batch.update(messageRef, {
          readBy: this.FieldValue.arrayUnion(userId),
        });
      });

      await batch.commit();
    }, "Failed to mark messages as read");
  }

  /**
   * Soft delete a message
   */
  async softDeleteMessage(messageId) {
    return await this.executeQuery(async () => {
      await this.db.collection(COLLECTIONS.MESSAGES).doc(messageId).update({
        isDeleted: true,
        deletedAt: this.FieldValue.serverTimestamp(),
      });
    }, "Failed to soft delete message");
  }
}

module.exports = MessagingQueries;
