/**
 * Topic Service for Forum
 * Handles all topic-related operations with validation
 */

const firebaseQueries = require("../../../queries/FirebaseQueries");
const { validators, Topic } = require("../../../models/forum.models");
const {
  createTopic,
  updateTopic,
  ValidationError,
  validateId,
  validatePaginationOptions,
} = require("../../../utils/validation.utils");

class TopicService {
  constructor() {
    this.queries = firebaseQueries;
  }

  async createTopic(topicData) {
    try {
      const {
        title,
        content,
        category,
        tags = [],
        images = [],
        userId,
      } = topicData;

      // Validate userId
      const validatedUserId = validateId(userId, "userId");

      // Create and validate topic using validation system
      const validatedTopic = createTopic({
        title,
        content,
        category,
        tags,
        images,
        userId: validatedUserId,
      });

      // Create topic in Firestore (timestamps will be added by FirebaseQueries)
      const topicRef = await this.queries.createTopic(validatedTopic);

      // Retrieve the created topic with actual server timestamps and ID
      return await this.queries.getTopicById(topicRef.id);
    } catch (error) {
      // Enhanced error handling with context
      if (error instanceof ValidationError) {
        throw new Error(`TOPIC_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to create topic - ${error.message}`
      );
    }
  }

  async updateTopic(topicId, updateData, userId) {
    try {
      // Validate required fields
      const validatedTopicId = validateId(topicId, "topicId");
      const validatedUserId = validateId(userId, "userId");

      // Get existing topic to verify ownership
      const existingTopic = await this.queries.getTopicById(validatedTopicId);
      if (!existingTopic || existingTopic.isDeleted) {
        throw new Error(
          "TOPIC_SERVICE_NOT_FOUND_ERROR: Topic not found or has been deleted"
        );
      }

      // Check if user is the author
      if (existingTopic.userId !== validatedUserId) {
        throw new Error(
          "TOPIC_SERVICE_UNAUTHORIZED: Only the author can update this topic"
        );
      }

      // Use validation system to create update data
      const validatedUpdateData = updateTopic(updateData);
      validatedUpdateData.updatedAt = new Date().toISOString();

      await this.queries.updateTopic(validatedTopicId, validatedUpdateData);

      return await this.queries.getTopicById(validatedTopicId);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`TOPIC_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      if (error.message.startsWith("TOPIC_SERVICE_")) throw error;
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to update topic - ${error.message}`
      );
    }
  }

  async deleteTopic(topicId, userId) {
    try {
      // Validate required fields
      const validatedTopicId = validateId(topicId, "topicId");
      const validatedUserId = validateId(userId, "userId");

      // Get existing topic to verify ownership
      const existingTopic = await this.queries.getTopicById(validatedTopicId);
      if (!existingTopic || existingTopic.isDeleted) {
        throw new Error(
          "TOPIC_SERVICE_NOT_FOUND_ERROR: Topic not found or already deleted"
        );
      }

      // Check if user is the author
      if (existingTopic.userId !== validatedUserId) {
        throw new Error(
          "TOPIC_SERVICE_UNAUTHORIZED: Only the author can delete this topic"
        );
      }

      // Soft delete by setting isDeleted flag
      await this.queries.updateTopic(validatedTopicId, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return { success: true, message: "Topic deleted successfully" };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`TOPIC_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      if (error.message.startsWith("TOPIC_SERVICE_")) throw error;
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to delete topic - ${error.message}`
      );
    }
  }

  async getTopics(options = {}) {
    try {
      const {
        limit = 20,
        category,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Validate pagination options
      const validatedOptions = validatePaginationOptions(
        { limit },
        { maxLimit: 100 }
      );

      const topics = await this.queries.getTopics({
        limit: validatedOptions.limit,
        category,
        orderBy: sortBy,
        orderDirection: sortOrder,
      });

      // Filter out deleted topics
      const filteredTopics = topics.filter((topic) => !topic.isDeleted);

      return {
        topics: filteredTopics,
        hasMore: topics.length === validatedOptions.limit,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`TOPIC_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      if (error.message.startsWith("TOPIC_SERVICE_")) throw error;
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to get topics - ${error.message}`
      );
    }
  }

  async getTopicById(topicId, userId = null) {
    try {
      // Validate topicId
      const validatedTopicId = validateId(topicId, "topicId");

      const topic = await this.queries.getTopicById(validatedTopicId);

      if (!topic || topic.isDeleted) {
        throw new Error(
          "TOPIC_SERVICE_NOT_FOUND_ERROR: Topic not found or has been deleted"
        );
      }

      // Increment view count if user is provided
      if (userId) {
        const validatedUserId = validateId(userId, "userId");
        await this.queries.incrementTopicViews(validatedTopicId);
        topic.viewCount = (topic.viewCount || 0) + 1;
      }

      return topic;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`TOPIC_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      if (error.message.startsWith("TOPIC_SERVICE_")) throw error;
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to get topic - ${error.message}`
      );
    }
  }

  async searchTopics(searchTerm, options = {}) {
    try {
      const { limit = 20, category = null } = options;

      if (!searchTerm || searchTerm.trim().length === 0) {
        throw new Error(
          "TOPIC_SERVICE_VALIDATION_ERROR: Search term is required"
        );
      }

      if (searchTerm.length < 2) {
        throw new Error(
          "TOPIC_SERVICE_VALIDATION_ERROR: Search term must be at least 2 characters"
        );
      }

      // Validate pagination options
      const validatedOptions = validatePaginationOptions(
        { limit },
        { maxLimit: 100 }
      );

      const topics = await this.queries.searchTopics(searchTerm, {
        limit: validatedOptions.limit,
        category,
      });

      return topics;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`TOPIC_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      if (error.message.startsWith("TOPIC_SERVICE_")) throw error;
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to search topics - ${error.message}`
      );
    }
  }

  async getTopicStats() {
    try {
      return await this.queries.getTopicStats();
    } catch (error) {
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to get topic stats - ${error.message}`
      );
    }
  }
}

module.exports = new TopicService();
