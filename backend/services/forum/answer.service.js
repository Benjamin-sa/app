/**
 * Answer Service for Forum
 * Handles basic answer CRUD operations with Firebase
 */

const firebaseQueries = require("../../queries/firebase.queries");
const {
  COLLECTIONS,
  validators,
  Answer,
} = require("../../models/forum.models");

class AnswerService {
  constructor() {
    this.queries = firebaseQueries;
  }

  async createAnswer(answerData) {
    try {
      const {
        topicId,
        content,
        authorId,
        parentAnswerId = null,
        images = [],
      } = answerData;

      // Validate required fields
      if (!topicId || !authorId || !content) {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: Topic ID, author ID, and content are required"
        );
      }

      // Validate content
      if (!validators.isValidContent(content)) {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: Content must be between 10 and 10000 characters"
        );
      }

      // Validate images
      if (!Array.isArray(images)) {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: Images must be an array"
        );
      }

      if (images.length > 5) {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: Maximum 5 images allowed"
        );
      }

      // Validate parentAnswerId if provided
      if (parentAnswerId && typeof parentAnswerId !== "string") {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: Parent answer ID must be a string"
        );
      }

      const answer = {
        ...Answer,
        topicId,
        content: content.trim(),
        authorId,
        images,
        parentAnswerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await this.queries.createAnswer(answer);
      return { id: docRef.id, ...answer };
    } catch (error) {
      if (error.message.startsWith("ANSWER_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `ANSWER_SERVICE_ERROR: Failed to create answer - ${error.message}`
      );
    }
  }

  async getAnswersByTopic(topicId, options = {}) {
    try {
      const { limit = 20 } = options;

      if (!topicId) {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: Topic ID is required"
        );
      }

      if (typeof limit !== "number" || limit < 1 || limit > 100) {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: Limit must be between 1 and 100"
        );
      }

      const answers = await this.queries.getAnswersByTopic(topicId, { limit });

      return {
        answers: Array.isArray(answers) ? answers : [answers],
        lastDoc: null,
        hasMore: false,
      };
    } catch (error) {
      if (error.message.startsWith("ANSWER_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `ANSWER_SERVICE_ERROR: Failed to get answers - ${error.message}`
      );
    }
  }

  async getAnswerStats() {
    try {
      return await this.queries.getAnswerStats();
    } catch (error) {
      throw new Error(`Failed to get answer stats: ${error.message}`);
    }
  }
}

module.exports = new AnswerService();
