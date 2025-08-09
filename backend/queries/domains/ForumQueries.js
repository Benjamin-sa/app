/**
 * Forum Queries
 * Handles all forum-related Firebase operations (Topics + Answers)
 */

const BaseFirebaseQueries = require("../base/BaseFirebaseQueries");
const { COLLECTIONS } = require("../../models/forum.models");

class ForumQueries extends BaseFirebaseQueries {
  // =====================
  // TOPIC OPERATIONS
  // =====================

  /**
   * Create a new topic
   */
  async createTopic(topicData) {
    return await this.executeQuery(async () => {
      const docRef = this.db.collection(COLLECTIONS.TOPICS).doc();

      const cleanTopicData = {
        ...topicData,
        id: docRef.id,
        createdAt: this.FieldValue.serverTimestamp(),
        updatedAt: this.FieldValue.serverTimestamp(),
        lastActivity: this.FieldValue.serverTimestamp(),
      };

      await docRef.set(cleanTopicData);
      return docRef;
    }, "FIREBASE_QUERIES_ERROR: Failed to create topic in Firestore");
  }

  /**
   * Get topic by ID
   */
  async getTopicById(topicId) {
    return await this.getDocumentById(
      COLLECTIONS.TOPICS,
      topicId,
      "Failed to get topic by ID",
      true // Transform timestamps
    );
  }

  /**
   * Get topics with pagination and filtering
   */
  async getTopics(options = {}) {
    const {
      limit = 20,
      category = null,
      orderBy = "lastActivity",
      orderDirection = "desc",
    } = options;

    let query = this.db.collection(COLLECTIONS.TOPICS);

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query
      .orderBy(orderBy, orderDirection)
      .limit(parseInt(limit))
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : data.updatedAt,
        lastActivity: data.lastActivity?.toDate
          ? data.lastActivity.toDate()
          : data.lastActivity,
      };
    });
  }

  /**
   * Update topic
   */
  async updateTopic(topicId, updateData) {
    return await this.updateDocument(
      COLLECTIONS.TOPICS,
      topicId,
      updateData,
      "Failed to update topic"
    );
  }

  /**
   * Increment topic view count
   */
  async incrementTopicViews(topicId) {
    return await this.executeQuery(
      () =>
        this.db
          .collection(COLLECTIONS.TOPICS)
          .doc(topicId)
          .update({
            viewCount: this.FieldValue.increment(1),
            lastActivity: this.FieldValue.serverTimestamp(),
          }),
      "Failed to increment topic views"
    );
  }

  /**
   * Search topics by title and content
   */
  async searchTopics(searchTerm, options = {}) {
    const { limit = 20, category = null } = options;

    let query = this.db
      .collection(COLLECTIONS.TOPICS)
      .where("isDeleted", "==", false);

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query
      .orderBy("lastActivity", "desc")
      .limit(100)
      .get();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt,
          lastActivity: data.lastActivity?.toDate
            ? data.lastActivity.toDate()
            : data.lastActivity,
        };
      })
      .filter((topic) => {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = topic.title.toLowerCase().includes(searchLower);
        const contentMatch = topic.content.toLowerCase().includes(searchLower);
        const tagMatch = topic.tags?.some((tag) =>
          tag.toLowerCase().includes(searchLower)
        );
        return titleMatch || contentMatch || tagMatch;
      })
      .slice(0, parseInt(limit));
  }

  // =====================
  // ANSWER OPERATIONS
  // =====================

  /**
   * Create a new answer
   */
  async createAnswer(answerData) {
    return await this.createDocument(
      COLLECTIONS.ANSWERS,
      answerData,
      "Failed to create answer"
    );
  }

  /**
   * Get answers by topic ID
   */
  async getAnswersByTopic(topicId, options = {}) {
    const { limit = 20 } = options;

    const snapshot = await this.db
      .collection(COLLECTIONS.ANSWERS)
      .where("topicId", "==", topicId)
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Update answer
   */
  async updateAnswer(answerId, updateData) {
    return await this.db
      .collection(COLLECTIONS.ANSWERS)
      .doc(answerId)
      .update({
        ...updateData,
        updatedAt: this.FieldValue.serverTimestamp(),
      });
  }

  /**
   * Soft delete answer
   */
  async deleteAnswer(answerId) {
    return await this.softDeleteDocument(
      COLLECTIONS.ANSWERS,
      answerId,
      "Failed to delete answer"
    );
  }

  /**
   * Get answer by ID
   */
  async getAnswerById(answerId) {
    return await this.getDocumentById(
      COLLECTIONS.ANSWERS,
      answerId,
      "Failed to get answer by ID"
    );
  }
}

module.exports = ForumQueries;
