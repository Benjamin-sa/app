/**
 * Topic Service for Forum
 * Handles all topic-related operations with validation
 */

const firebaseQueries = require("../../queries/firebase.queries");
const { validators, Topic } = require("../../models/forum.models");

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
        authorId,
      } = topicData;

      // Validate required fields
      if (!title || !content || !category || !authorId) {
        throw new Error(
          "TOPIC_SERVICE_VALIDATION_ERROR: Title, content, category, and author ID are required"
        );
      }

      // Validate title
      if (
        !validators.isValidTitle ||
        typeof title !== "string" ||
        title.trim().length < 5 ||
        title.trim().length > 200
      ) {
        throw new Error(
          "TOPIC_SERVICE_VALIDATION_ERROR: Title must be between 5 and 200 characters"
        );
      }

      // Validate content
      if (!validators.isValidContent(content)) {
        throw new Error("TOPIC_SERVICE_VALIDATION_ERROR: Content");
      }

      if (!validators.isValidCategory(category)) {
        throw new Error(
          "TOPIC_SERVICE_VALIDATION_ERROR: Valid category is required"
        );
      }

      // Validate required fields
      if (!authorId) {
        throw new Error(
          "TOPIC_SERVICE_VALIDATION_ERROR: Author ID is required"
        );
      }

      // Create topic document using the model
      const topicDoc = {
        ...Topic,
        title: title.trim(),
        content: content.trim(),
        authorId,
        category,
        tags,
        images, // Images already have ISO string timestamps from image service
      };

      // Create topic in Firestore (timestamps will be added by firebase.queries)
      const topicRef = await this.queries.createTopic(topicDoc);

      // Retrieve the created topic with actual server timestamps and ID
      const createdTopic = await this.queries.getTopicById(topicRef.id);

      return createdTopic;
    } catch (error) {
      // Enhanced error handling with context
      if (error.message.startsWith("TOPIC_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to create topic - ${error.message}`
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

      // Validate limit
      if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        throw new Error(
          "TOPIC_SERVICE_VALIDATION_ERROR: Limit must be between 1 and 100"
        );
      }

      const topics = await this.queries.getTopics({
        limit: parseInt(limit),
        category,
        orderBy: sortBy,
        orderDirection: sortOrder,
      });

      // Filter out deleted topics
      const filteredTopics = topics.filter((topic) => !topic.isDeleted);

      return {
        topics: filteredTopics,
        hasMore: topics.length === parseInt(limit),
      };
    } catch (error) {
      if (error.message.startsWith("TOPIC_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to get topics - ${error.message}`
      );
    }
  }

  async getTopicById(topicId, userId = null) {
    try {
      if (!topicId) {
        throw new Error("TOPIC_SERVICE_VALIDATION_ERROR: Topic ID is required");
      }

      const topic = await this.queries.getTopicById(topicId);

      if (!topic || topic.isDeleted) {
        throw new Error(
          "TOPIC_SERVICE_NOT_FOUND_ERROR: Topic not found or has been deleted"
        );
      }

      // Increment view count if user is provided
      if (userId) {
        await this.queries.incrementTopicViews(topicId);
        topic.viewCount = (topic.viewCount || 0) + 1;
      }

      return topic;
    } catch (error) {
      if (error.message.startsWith("TOPIC_SERVICE_")) {
        throw error;
      }
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

      // Validate limit
      if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        throw new Error(
          "TOPIC_SERVICE_VALIDATION_ERROR: Limit must be between 1 and 100"
        );
      }

      const topics = await this.queries.searchTopics(searchTerm, {
        limit,
        category,
      });

      return topics;
    } catch (error) {
      if (error.message.startsWith("TOPIC_SERVICE_")) {
        throw error;
      }
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
