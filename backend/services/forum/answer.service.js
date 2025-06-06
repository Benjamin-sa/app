/**
 * Answer Service for Forum
 * Handles all answer-related operations
 */

const { firestore } = require("../../config/firebase");
const admin = require("firebase-admin");
const { COLLECTIONS, validators } = require("../../models/forum.models");
const UserService = require("./user.service");
const imageService = require("../image.service");

class AnswerService {
  constructor() {
    this.db = firestore;
  }

  async createAnswer(answerData, images = []) {
    try {
      const { topicId, content, authorId, parentAnswerId = null } = answerData;

      if (!validators.isValidContent(content)) {
        throw new Error("Content must be between 10 and 10000 characters");
      }

      // Check if topic exists and is not locked
      const topicDoc = await this.db
        .collection(COLLECTIONS.TOPICS)
        .doc(topicId)
        .get();
      if (!topicDoc.exists) {
        throw new Error("Topic not found");
      }

      const topic = topicDoc.data();
      if (topic.isLocked) {
        throw new Error("Topic is locked");
      }

      const author = await UserService.getUserProfile(authorId);
      if (!author) {
        throw new Error("Author not found");
      }

      let imageRecords = [];
      if (images && images.length > 0) {
        imageRecords = await imageService.uploadMultipleImages(
          images,
          "forum/answers"
        );
      }

      const answer = {
        topicId,
        content,
        authorId,
        authorDisplayName: author.displayName,
        authorAvatar: author.avatar,
        images: imageRecords,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isAccepted: false,
        isDeleted: false,
        votes: { upvotes: 0, downvotes: 0, score: 0 },
        parentAnswerId,
      };

      const docRef = await this.db.collection(COLLECTIONS.ANSWERS).add(answer);

      // Update topic stats
      await this.db
        .collection(COLLECTIONS.TOPICS)
        .doc(topicId)
        .update({
          answerCount: admin.firestore.FieldValue.increment(1),
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Update user stats
      await UserService.incrementUserStats(authorId, "answers_posted");

      return { id: docRef.id, ...answer };
    } catch (error) {
      throw new Error(`Failed to create answer: ${error.message}`);
    }
  }

  async getAnswersByTopic(topicId, options = {}) {
    try {
      const { limit = 20 } = options;

      const snapshot = await this.db
        .collection(COLLECTIONS.ANSWERS)
        .where("topicId", "==", topicId)
        .limit(limit)
        .get();

      let answers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter out deleted answers client-side
      answers = answers.filter((answer) => !answer.isDeleted);

      return {
        answers,
        lastDoc: null, // Simplified pagination
        hasMore: false,
      };
    } catch (error) {
      throw new Error(`Failed to get answers: ${error.message}`);
    }
  }
}

module.exports = new AnswerService();
