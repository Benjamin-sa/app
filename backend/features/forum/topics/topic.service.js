/**
 * Topic Service for Forum
 * Handles all topic-related operations with validation
 */

const firebaseQueries = require("../../../queries/FirebaseQueries");
const { validators, Topic } = require("../../../models/forum.models");
const ValidationUtils = require("../../../utils/validation.utils");
const htmlSanitizerService = require("../../../core/services/htmlSanitizer.service");

class TopicService {
  constructor() {
    this.queries = firebaseQueries;
  }

  // Enhanced helper method for topic validation
  validateTopicData(topicData, isUpdate = false) {
    const { title, content, category, userId, images = [] } = topicData;

    // For creates, all required fields must be present
    if (!isUpdate) {
      ValidationUtils.required(
        { title, content, category, userId },
        "TOPIC",
        "create topic"
      );
    }

    // Validate individual fields if provided
    if (ValidationUtils.exists(title)) {
      ValidationUtils.topicTitle(title, "TOPIC");
    }

    if (ValidationUtils.exists(content)) {
      ValidationUtils.htmlContent(content, "TOPIC");
    }

    if (ValidationUtils.exists(category)) {
      ValidationUtils.category(category, "TOPIC");
    }

    // Validate images array
    ValidationUtils.array(images, "images", "TOPIC", false, 5);
  }

  // Helper method for common validations
  validateCommonParams(limit) {
    if (ValidationUtils.exists(limit)) {
      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new Error(
          "TOPIC_SERVICE_VALIDATION_ERROR: Limit must be between 1 and 100"
        );
      }
    }
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

      // All validation in clean, single lines
      ValidationUtils.required(
        { title, content, category, userId },
        "TOPIC",
        "create topic"
      );
      ValidationUtils.topicTitle(title, "TOPIC");
      ValidationUtils.htmlContent(content, "TOPIC");
      ValidationUtils.category(category, "TOPIC");
      ValidationUtils.array(images, "images", "TOPIC", false, 5);

      // Sanitize HTML content
      const sanitizedContent =
        htmlSanitizerService.sanitizeForumContent(content);

      const topicDoc = {
        ...Topic,
        title: title.trim(),
        content: sanitizedContent,
        userId,
        category,
        tags,
        images,
      };

      // Create topic in Firestore (timestamps will be added by FirebaseQueries)
      const topicRef = await this.queries.createTopic(topicDoc);

      // Retrieve the created topic with actual server timestamps and ID
      return await this.queries.getTopicById(topicRef.id);
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

  async updateTopic(topicId, updateData, userId) {
    try {
      if (!topicId) {
        throw new Error("TOPIC_SERVICE_VALIDATION_ERROR: Topic ID is required");
      }

      if (!userId) {
        throw new Error("TOPIC_SERVICE_VALIDATION_ERROR: User ID is required");
      }

      // Validate update data using helper method
      this.validateTopicData(updateData, true);

      // Get existing topic to verify ownership
      const existingTopic = await this.queries.getTopicById(topicId);
      if (!existingTopic || existingTopic.isDeleted) {
        throw new Error(
          "TOPIC_SERVICE_NOT_FOUND_ERROR: Topic not found or has been deleted"
        );
      }

      // Check if user is the author
      if (existingTopic.userId !== userId) {
        throw new Error(
          "TOPIC_SERVICE_UNAUTHORIZED: Only the author can update this topic"
        );
      }

      // Prepare update object with only provided fields
      const updateObj = {};
      if (updateData.title) updateObj.title = updateData.title.trim();
      if (updateData.content) {
        // Sanitize HTML content for updates
        updateObj.content = htmlSanitizerService.sanitizeForumContent(
          updateData.content
        );
      }
      if (updateData.category) updateObj.category = updateData.category;
      if (updateData.tags) updateObj.tags = updateData.tags;
      if (updateData.images) updateObj.images = updateData.images;

      updateObj.updatedAt = new Date().toISOString();

      await this.queries.updateTopic(topicId, updateObj);

      return await this.queries.getTopicById(topicId);
    } catch (error) {
      if (error.message.startsWith("TOPIC_SERVICE_")) throw error;
      throw new Error(
        `TOPIC_SERVICE_ERROR: Failed to update topic - ${error.message}`
      );
    }
  }

  async deleteTopic(topicId, userId) {
    try {
      if (!topicId) {
        throw new Error("TOPIC_SERVICE_VALIDATION_ERROR: Topic ID is required");
      }

      if (!userId) {
        throw new Error("TOPIC_SERVICE_VALIDATION_ERROR: User ID is required");
      }

      // Get existing topic to verify ownership
      const existingTopic = await this.queries.getTopicById(topicId);
      if (!existingTopic || existingTopic.isDeleted) {
        throw new Error(
          "TOPIC_SERVICE_NOT_FOUND_ERROR: Topic not found or already deleted"
        );
      }

      // Check if user is the author
      if (existingTopic.userId !== userId) {
        throw new Error(
          "TOPIC_SERVICE_UNAUTHORIZED: Only the author can delete this topic"
        );
      }

      // Soft delete by setting isDeleted flag
      await this.queries.updateTopic(topicId, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return { success: true, message: "Topic deleted successfully" };
    } catch (error) {
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

      // Use helper method for validation
      this.validateCommonParams(limit);

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
      if (error.message.startsWith("TOPIC_SERVICE_")) throw error;
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

      // Use helper method for validation
      this.validateCommonParams(limit);

      const topics = await this.queries.searchTopics(searchTerm, {
        limit,
        category,
      });

      return topics;
    } catch (error) {
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
