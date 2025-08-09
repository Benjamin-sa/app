import firebaseQueries = require("../../../queries/FirebaseQueries");
import {
  createAnswer as createAnswerSchema,
  updateAnswer as updateAnswerSchema,
  ValidationError,
  validateId,
  validatePaginationOptions,
} from "../../../utils/validation.utils";
import { Answer } from "../../../types/entities/forum.types";

interface CreateAnswerData {
  content: string;
  userId: string;
  topicId: string;
  parentAnswerId?: string | null;
  images?: any[];
}

interface GetAnswersOptions {
  limit?: number;
}

class AnswerService {
  private queries: any;
  constructor() {
    this.queries = firebaseQueries;
  }

  async createAnswer(answerData: CreateAnswerData) {
    try {
      const validatedAnswer: Answer = createAnswerSchema(answerData);
      // Note: createdAt and updatedAt will be handled by Firestore serverTimestamp
      // Remove the manual timestamp setting as it should be handled by the database layer
      const docRef = await this.queries.createAnswer(validatedAnswer);
      const created = { id: docRef.id, ...validatedAnswer };
      await this.updateTopicAndCategoryActivity(
        validatedAnswer.topicId,
        validatedAnswer.userId
      );
      return created;
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`ANSWER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("ANSWER_SERVICE_")) throw error;
      throw new Error(
        `ANSWER_SERVICE_ERROR: Failed to create answer - ${error.message}`
      );
    }
  }

  async getAnswersByTopic(topicId: string, options: GetAnswersOptions = {}) {
    try {
      const validatedTopicId = validateId(topicId);
      const validatedOptions = validatePaginationOptions(options as any);
      const limit = (validatedOptions as any).limit || 20;
      const answers = await this.queries.getAnswersByTopic(validatedTopicId, {
        limit,
      });

      // Keep soft-deleted answers in the list but mask their content (Reddit-like behavior)
      const arrayAnswers = Array.isArray(answers)
        ? answers
        : answers
        ? [answers]
        : [];
      const mappedAnswers = arrayAnswers.map((answer: any) => {
        if (answer?.isDeleted) {
          return {
            ...answer,
            content: "<p>[deleted]</p>",
            images: [], // remove images for deleted answers
          };
        }
        return answer;
      });

      return {
        answers: mappedAnswers,
        lastDoc: null,
        hasMore: false,
      };
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`ANSWER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("ANSWER_SERVICE_")) throw error;
      throw new Error(
        `ANSWER_SERVICE_ERROR: Failed to get answers - ${error.message}`
      );
    }
  }

  async updateAnswer(answerId: string, updateData: Partial<CreateAnswerData>) {
    try {
      const validatedAnswerId = validateId(answerId);
      if (
        !updateData ||
        typeof updateData !== "object" ||
        Object.keys(updateData).length === 0
      ) {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: Update data is required and must be a non-empty object"
        );
      }
      const validatedData: Partial<Answer> = updateAnswerSchema(updateData);
      if (Object.keys(validatedData).length === 0) {
        throw new Error(
          "ANSWER_SERVICE_VALIDATION_ERROR: No valid fields provided for update."
        );
      }
      // Remove manual timestamp setting - let Firestore handle it via the updateAnswer query
      return await this.queries.updateAnswer(validatedAnswerId, validatedData);
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`ANSWER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("ANSWER_SERVICE_")) throw error;
      throw new Error(
        `ANSWER_SERVICE_ERROR: Failed to update answer - ${error.message}`
      );
    }
  }

  async deleteAnswer(answerId: string) {
    try {
      const validatedAnswerId = validateId(answerId);
      await this.queries.deleteAnswer(validatedAnswerId);
      return { id: validatedAnswerId, message: "Answer deleted successfully" };
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`ANSWER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("ANSWER_SERVICE_")) throw error;
      throw new Error(
        `ANSWER_SERVICE_ERROR: Failed to delete answer - ${error.message}`
      );
    }
  }

  async getAnswerStats() {
    return this.queries.getAnswerStats();
  }

  async updateTopicAndCategoryActivity(topicId: string, userId: string) {
    try {
      const topic = await this.queries.getTopicById(topicId);
      if (!topic || topic.isDeleted) return;
      await this.queries.updateTopic(topicId, {
        lastActivity: this.queries.FieldValue.serverTimestamp(),
      });
      const userData = await this.queries.getUserById(userId);
      const activityData = {
        topicId: topic.id,
        topicTitle: topic.title,
        userId,
        userName: userData?.displayName || userData?.username || "Anonymous",
        userAvatar: userData?.avatar || null,
      };
      await this.queries.updateCategoryLastActivity(
        topic.category,
        activityData
      );
    } catch (error: any) {
      console.warn(
        `Failed to update topic/category activity: ${error.message}`
      );
    }
  }
}

const answerService = new AnswerService();
export default answerService;
module.exports = answerService;
