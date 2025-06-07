/**
 * Topic Service for Forum
 * Handles all topic-related operations
 */

const firebaseQueries = require("../../queries/firebase.queries");
const { COLLECTIONS, validators } = require("../../models/forum.models");
const imageService = require("../image.service");

class TopicService {
  constructor() {
    this.queries = firebaseQueries;
  }

  async createTopic(topicData, uploadedFiles = []) {
    try {
      // Validate topic data
      if (!validators.isValidTopicTitle(topicData.title)) {
        throw new Error("Title must be between 5 and 200 characters");
      }

      if (!validators.isValidContent(topicData.content)) {
        throw new Error("Content must be between 10 and 10000 characters");
      }

      if (!validators.isValidCategory(topicData.category)) {
        throw new Error("Valid category is required");
      }

      // Process uploaded files (if any)
      let imageRecords = [];
      if (uploadedFiles.length > 0) {
        imageRecords = await imageService.uploadImages(
          uploadedFiles,
          "forum/topics"
        );
      }

      // Process pre-uploaded image URLs
      let preUploadedImages = [];
      if (topicData.images && topicData.images.length > 0) {
        preUploadedImages = topicData.images.map((imageUrl) => {
          // If it's already a proper image object, return it
          if (typeof imageUrl === "object" && imageUrl.url) {
            return imageUrl;
          }
          // If it's just a URL string, create image object
          return {
            url: imageUrl,
            thumbnailUrl: imageUrl,
            mediumUrl: imageUrl,
          };
        });
      }

      // Combine all images
      const allImages = [...imageRecords, ...preUploadedImages];

      // Get author info
      const authorData = await this.queries.getUserById(topicData.authorId);

      // Create topic document
      const topicDoc = {
        title: topicData.title.trim(),
        content: topicData.content.trim(),
        authorId: topicData.authorId,
        authorDisplayName:
          authorData?.displayName || authorData?.username || "Anonymous",
        authorAvatar: authorData?.avatar || "",
        category: topicData.category,
        tags: topicData.tags || [],
        images: allImages,
        viewCount: 0,
        answerCount: 0,
        isPinned: false,
        isLocked: false,
        isDeleted: false,
        votes: {
          upvotes: 0,
          downvotes: 0,
          score: 0,
        },
      };

      // Create topic in Firestore
      const topicRef = await this.queries.createTopic(topicDoc);

      // Update user stats
      if (authorData) {
        await this.queries.incrementUserStats(
          topicData.authorId,
          "topics_created"
        );
        await this.queries.updateUserActivity(topicData.authorId);
      }

      // Return created topic with ID
      return {
        id: topicRef.id,
        ...topicDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
      };
    } catch (error) {
      console.error("Error creating topic:", error);
      throw error;
    }
  }

  async getTopics(options = {}) {
    try {
      const { limit = 20 } = options;

      // Use the abstraction layer to get topics
      const topics = await this.queries.getTopics({
        limit: parseInt(limit),
        orderBy: "createdAt",
        orderDirection: "desc",
      });

      // Filter out deleted topics
      const filteredTopics = topics.filter((topic) => !topic.isDeleted);

      return {
        topics: filteredTopics,
        hasMore: topics.length === parseInt(limit),
      };
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw error;
    }
  }

  async getTopicById(topicId, userId = null) {
    try {
      const topic = await this.queries.getTopicById(topicId);

      if (!topic || topic.isDeleted) {
        return null;
      }

      // Increment view count if user is provided
      if (userId) {
        await this.queries.incrementTopicViews(topicId);
        // Update view count in returned object
        topic.viewCount = (topic.viewCount || 0) + 1;

        // Get user's vote if logged in
        topic.userVote = await this.queries.getUserVote(userId, topicId);
      }

      return topic;
    } catch (error) {
      console.error("Error fetching topic:", error);
      throw error;
    }
  }

  async incrementViewCount(topicId) {
    try {
      await this.queries.incrementTopicViews(topicId);
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  }

  async searchTopics(searchTerm, options = {}) {
    try {
      const { limit = 20, category = null } = options;

      const topics = await this.queries.searchTopics(searchTerm, {
        limit,
        category,
      });

      return topics;
    } catch (error) {
      console.error("Error searching topics:", error);
      throw error;
    }
  }

  async getForumStats() {
    try {
      return await this.queries.getForumStats();
    } catch (error) {
      console.error("Error getting forum stats:", error);
      throw error;
    }
  }
}

module.exports = new TopicService();
