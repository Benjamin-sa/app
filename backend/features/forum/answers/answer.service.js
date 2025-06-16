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
const ValidationUtils = require("../../../utils/validation.utils");
const htmlSanitizerService = require("../../../core/services/htmlSanitizer.service");

class AnswerService {
  constructor() {
    this.queries = firebaseQueries;
  }

  async createAnswer(answerData) {
    try {
      const {
        topicId,
        content,
        userId,
        parentAnswerId = null,
        images = [],
      } = answerData;

      // Validate required fields using ValidationUtils
      ValidationUtils.required(
        { topicId, content, userId },
        "ANSWER",
        "create answer"
      );

      // Validate content
      ValidationUtils.htmlContent(content, "ANSWER");

      // Validate images array
      ValidationUtils.array(images, "images", "ANSWER", false, 5);

      // Validate parentAnswerId if provided
      if (
        ValidationUtils.exists(parentAnswerId) &&
        typeof parentAnswerId !== "string"
      ) {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: Parent answer ID must be a string"
        );
      }

      const answer = {
        ...Answer,
        topicId,
        content: htmlSanitizerService.sanitizeForumContent(content),
        userId,
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

      // Validate required fields
      ValidationUtils.required({ topicId }, "ANSWER", "get answers");

      // Validate limit
      if (ValidationUtils.exists(limit)) {
        if (typeof limit !== "number" || limit < 1 || limit > 100) {
          throw new Error(
            "ANSWER_SERVICE_VALIDATION_ERROR: Limit must be a number between 1 and 100"
          );
        }
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

  async updateAnswer(answerId, updateData) {
    try {
      // Validate required parameters
      ValidationUtils.required({ answerId }, "ANSWER", "update answer");

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

      const fieldsToUpdate = {};

      // Validate and add content if provided
      if (updateData.hasOwnProperty("content")) {
        ValidationUtils.htmlContent(updateData.content, "ANSWER");
        fieldsToUpdate.content = htmlSanitizerService.sanitizeForumContent(
          updateData.content
        );
      }

      // Validate and add images if provided
      if (updateData.hasOwnProperty("images")) {
        ValidationUtils.array(updateData.images, "images", "ANSWER", false, 5);
        fieldsToUpdate.images = updateData.images;
      }

      // Ensure at least one valid field is being updated
      if (Object.keys(fieldsToUpdate).length === 0) {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: No valid fields provided for update. Allowed fields are 'content' and 'images'."
        );
      }

      fieldsToUpdate.updatedAt = new Date().toISOString();

      // Assumes this.queries.updateAnswer updates and returns the full updated document.
      // This is key for "without loss of functionality" and "least lines" in this file.
      // If this.queries.updateAnswer doesn't return the updated doc, it (or this service) needs adjustment.
      const updatedAnswer = await this.queries.updateAnswer(
        answerId,
        fieldsToUpdate
      );
      return updatedAnswer;
    } catch (error) {
      if (error.message.startsWith("ANSWER_SERVICE_")) {
        throw error; // Re-throw custom service errors
      }
      // Wrap other errors
      throw new Error(
        `ANSWER_SERVICE_ERROR: Failed to update answer - ${error.message}`
      );
    }
  }

  async deleteAnswer(answerId) {
    try {
      if (!answerId || typeof answerId !== "string") {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: Answer ID is required and must be a string"
        );
      }

      await this.queries.deleteAnswer(answerId);
      // Standard practice for delete operations is to return a success status or the ID.
      return { id: answerId, message: "Answer deleted successfully" };
    } catch (error) {
      if (error.message.startsWith("ANSWER_SERVICE_")) {
        throw error; // Re-throw custom service errors (e.g., if query layer throws one, or validation error from above)
      }
      // Wrap other errors
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
