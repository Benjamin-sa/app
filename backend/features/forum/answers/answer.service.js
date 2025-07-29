/**
 * Answer Service for Forum
 * Handles basic answer CRUD operations with Firebase
 */

const firebaseQueries = require("../../../queries/FirebaseQueries");
const {
  COLLECTIONS,
  validators,
  Answer,
} = require("../../../models/forum.models");
const {
  createAnswer,
  updateAnswer,
  ValidationError,
  validateId,
  validatePaginationOptions,
} = require("../../../utils/validation.utils");

class AnswerService {
  constructor() {
    this.queries = firebaseQueries;
  }

  async createAnswer(answerData) {
    try {
      // Use new validation system - automatically validates and sanitizes
      const validatedAnswer = createAnswer(answerData);

      // Add timestamps (Firebase responsibility as discussed)
      validatedAnswer.createdAt = new Date().toISOString();
      validatedAnswer.updatedAt = new Date().toISOString();

      const docRef = await this.queries.createAnswer(validatedAnswer);
      const createdAnswer = { id: docRef.id, ...validatedAnswer };

      // Update topic's last activity and category statistics
      await this.updateTopicAndCategoryActivity(topicId, validatedAnswer.userId);

      return createdAnswer;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`ANSWER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
      // Validate topicId using new validation utility
      const validatedTopicId = validateId(topicId, "topicId");

      // Validate pagination options
      const validatedOptions = validatePaginationOptions(options);
      const limit = validatedOptions.limit || 20;

      const answers = await this.queries.getAnswersByTopic(validatedTopicId, {
        limit,
      });

      return {
        answers: Array.isArray(answers) ? answers : [answers],
        lastDoc: null,
        hasMore: false,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`ANSWER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      if (error.message.startsWith("ANSWER_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `ANSWER_SERVICE_ERROR: Failed to get answers - ${error.message}`
      );
    }
  }

  async updateAnswer(answerId, updateData) {
    try {
      // Validate answerId using new validation utility
      const validatedAnswerId = validateId(answerId, "answerId");

      // Ensure updateData is an object and has properties
      if (
        !updateData ||
        typeof updateData !== "object" ||
        Object.keys(updateData).length === 0
      ) {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: Update data is required and must be a non-empty object"
        );
      }

      // Use new validation system for updates (relaxed validation)
      const validatedData = updateAnswer(updateData);

      // Ensure at least one valid field is being updated
      if (Object.keys(validatedData).length === 0) {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: No valid fields provided for update."
        );
      }

      // Add update timestamp
      validatedData.updatedAt = new Date().toISOString();

      const updatedAnswer = await this.queries.updateAnswer(
        validatedAnswerId,
        validatedData
      );
      return updatedAnswer;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`ANSWER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      if (error.message.startsWith("ANSWER_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `ANSWER_SERVICE_ERROR: Failed to update answer - ${error.message}`
      );
    }
  }

  async deleteAnswer(answerId) {
    try {
      // Validate answerId using new validation utility
      const validatedAnswerId = validateId(answerId, "answerId");

      await this.queries.deleteAnswer(validatedAnswerId);
      return { id: validatedAnswerId, message: "Answer deleted successfully" };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`ANSWER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      if (error.message.startsWith("ANSWER_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `ANSWER_SERVICE_ERROR: Failed to delete answer - ${error.message}`
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

  /**
   * Update topic and category activity when an answer is posted
   */
  async updateTopicAndCategoryActivity(topicId, userId) {
    try {
      // Get the topic to find its category
      const topic = await this.queries.getTopicById(topicId);
      if (!topic || topic.isDeleted) {
        return; // Topic doesn't exist, skip update
      }

      // Update topic's last activity
      await this.queries.updateTopic(topicId, {
        lastActivity: new Date().toISOString(),
      });

      // Get user data for activity tracking
      const userData = await this.queries.getUserById(userId);
      
      const activityData = {
        topicId: topic.id,
        topicTitle: topic.title,
        userId: userId,
        userName: userData?.displayName || userData?.username || 'Anonymous',
        userAvatar: userData?.avatar || null,
      };

      // Update category last activity
      await this.queries.updateCategoryLastActivity(topic.category, activityData);
    } catch (error) {
      // Don't throw here as this is a background operation
      console.warn(`Failed to update topic/category activity: ${error.message}`);
    }
  }
}

module.exports = new AnswerService();
