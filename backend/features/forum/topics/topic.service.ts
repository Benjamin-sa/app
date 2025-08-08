import firebaseQueries = require("../../../queries/FirebaseQueries");
import {
  createTopic as createTopicSchema,
  updateTopic as updateTopicSchema,
  ValidationError,
  validateId,
  validatePaginationOptions,
  Topic,
} from "../../../utils/validation.utils";

interface GetTopicsOptions {
  limit?: number;
  category?: string | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class TopicService {
  private queries: any;
  constructor() {
    this.queries = firebaseQueries;
  }

  async createTopic(topicData: any) {
    try {
      const {
        title,
        content,
        category,
        tags = [],
        images = [],
        userId,
      } = topicData;
      const validatedUserId = validateId(userId);
      const validatedTopic = createTopicSchema({
        title,
        content,
        category,
        tags,
        images,
        userId: validatedUserId,
      }) as Topic & Record<string, any>;
      const topicRef = await this.queries.createTopic(validatedTopic);
      const createdTopic = await this.queries.getTopicById(topicRef.id);
      await this.updateCategoryStatistics(category, createdTopic);
      return createdTopic;
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`TOPIC_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("TOPIC_SERVICE_")) throw error;
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to create topic - ${error.message}`
      );
    }
  }

  async updateTopic(topicId: string, updateData: any, userId: string) {
    try {
      const validatedTopicId = validateId(topicId);
      const validatedUserId = validateId(userId);
      const existing = await this.queries.getTopicById(validatedTopicId);
      if (!existing || existing.isDeleted)
        throw new Error(
          "TOPIC_SERVICE_NOT_FOUND_ERROR: Topic not found or deleted"
        );
      if (existing.userId !== validatedUserId)
        throw new Error("TOPIC_SERVICE_UNAUTHORIZED: Only author can update");
      const validatedUpdate = updateTopicSchema(updateData) as Record<
        string,
        any
      >;
      validatedUpdate.updatedAt = new Date().toISOString();
      await this.queries.updateTopic(validatedTopicId, validatedUpdate);
      const updated = await this.queries.getTopicById(validatedTopicId);
      if (validatedUpdate.title || validatedUpdate.content) {
        await this.updateCategoryStatistics(updated.category, updated);
      }
      return updated;
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`TOPIC_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("TOPIC_SERVICE_")) throw error;
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to update topic - ${error.message}`
      );
    }
  }

  async deleteTopic(topicId: string, userId: string) {
    try {
      const validatedTopicId = validateId(topicId);
      const validatedUserId = validateId(userId);
      const existing = await this.queries.getTopicById(validatedTopicId);
      if (!existing || existing.isDeleted)
        throw new Error(
          "TOPIC_SERVICE_NOT_FOUND_ERROR: Topic not found or already deleted"
        );
      if (existing.userId !== validatedUserId)
        throw new Error("TOPIC_SERVICE_UNAUTHORIZED: Only author can delete");
      await this.queries.updateTopic(validatedTopicId, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { success: true, message: "Topic deleted successfully" };
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`TOPIC_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("TOPIC_SERVICE_")) throw error;
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to delete topic - ${error.message}`
      );
    }
  }

  async getTopics(options: GetTopicsOptions = {}) {
    try {
      const {
        limit = 20,
        category,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;
      const validated = validatePaginationOptions({ limit });
      const topics = await this.queries.getTopics({
        limit: validated.limit,
        category,
        orderBy: sortBy,
        orderDirection: sortOrder,
      });
      const filtered = topics.filter((t: any) => !t.isDeleted);
      return { topics: filtered, hasMore: topics.length === validated.limit };
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`TOPIC_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("TOPIC_SERVICE_")) throw error;
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to get topics - ${error.message}`
      );
    }
  }

  async getTopicById(topicId: string, userId: string | null = null) {
    try {
      const validatedTopicId = validateId(topicId);
      const topic = await this.queries.getTopicById(validatedTopicId);
      if (!topic || topic.isDeleted)
        throw new Error(
          "TOPIC_SERVICE_NOT_FOUND_ERROR: Topic not found or deleted"
        );
      if (userId) {
        validateId(userId);
        await this.queries.incrementTopicViews(validatedTopicId);
        topic.viewCount = (topic.viewCount || 0) + 1;
      }
      return topic;
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`TOPIC_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("TOPIC_SERVICE_")) throw error;
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to get topic - ${error.message}`
      );
    }
  }

  async searchTopics(
    searchTerm: string,
    options: { limit?: number; category?: string | null } = {}
  ) {
    try {
      const { limit = 20, category = null } = options;
      if (!searchTerm || searchTerm.trim().length === 0)
        throw new Error(
          "TOPIC_SERVICE_VALIDATION_ERROR: Search term is required"
        );
      if (searchTerm.length < 2)
        throw new Error(
          "TOPIC_SERVICE_VALIDATION_ERROR: Search term must be at least 2 characters"
        );
      const validated = validatePaginationOptions({ limit });
      return await this.queries.searchTopics(searchTerm, {
        limit: validated.limit,
        category,
      });
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`TOPIC_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("TOPIC_SERVICE_")) throw error;
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to search topics - ${error.message}`
      );
    }
  }

  async getTopicStats() {
    return this.queries.getTopicStats();
  }

  async updateCategoryStatistics(categoryId: string, topicData: any) {
    try {
      const userData = await this.queries.getUserById(topicData.userId);
      const activityData = {
        topicId: topicData.id,
        topicTitle: topicData.title,
        userId: topicData.userId,
        userName: userData?.displayName || userData?.username || "Anonymous",
        userAvatar: userData?.avatar || null,
      };
      await this.queries.updateCategoryLastActivity(categoryId, activityData);
    } catch (error: any) {
      console.warn(`Failed to update category statistics: ${error.message}`);
    }
  }

  async trackTopicView(topicId: string, userId: string | null = null) {
    try {
      const validatedTopicId = validateId(topicId);
      const topic = await this.queries.getTopicById(validatedTopicId);
      if (!topic || topic.isDeleted) throw new Error("Topic not found");
      await this.queries.incrementTopicViews(validatedTopicId);
      await this.queries.updateCategoryViews(topic.category, 1);
      return true;
    } catch (error: any) {
      console.warn(`Failed to track topic view: ${error.message}`);
      return false;
    }
  }
}

const topicService = new TopicService();
export default topicService;
module.exports = topicService;
