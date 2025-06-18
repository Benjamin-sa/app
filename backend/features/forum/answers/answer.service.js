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
      return { id: docRef.id, ...validatedAnswer };
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
}

module.exports = new AnswerService();
