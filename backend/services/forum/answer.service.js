/**
 * Answer Service for Forum
 * Handles all answer-related operations
 */

const firebaseQueries = require("../../queries/firebase.queries");
const {
  COLLECTIONS,
  validators,
  Answer,
} = require("../../models/forum.models");
const UserService = require("./user.service");
const imageService = require("../image.service");

class AnswerService {
  constructor() {
    this.queries = firebaseQueries;
  }

  async createAnswer(answerData, images = []) {
    try {
      const { topicId, content, authorId, parentAnswerId = null } = answerData;

      if (!validators.isValidContent(content)) {
        throw new Error("Content must be between 10 and 10000 characters");
      }

      // Check if topic exists and is not locked
      const topic = await this.queries.getTopicById(topicId);
      if (!topic) {
        throw new Error("Topic not found");
      }

      if (topic.isLocked) {
        throw new Error("Topic is locked");
      }

      const author = await UserService.getUserProfile(authorId);
      if (!author) {
        throw new Error("Author not found");
      }

      let imageRecords = [];
      if (images && images.length > 0) {
        imageRecords = await imageService.uploadImages(images, "forum/answers");
      }

      const answer = {
        ...Answer,
        topicId,
        content,
        authorId,
        authorDisplayName: author.displayName,
        authorAvatar: author.avatar,
        images: imageRecords,
        parentAnswerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await this.queries.createAnswer(answer);

      // Update topic stats
      await this.queries.updateTopicAnswerCount(topicId, 1);

      // Update user stats
      await UserService.incrementUserStats(authorId, "answers_posted");

      return { id: docRef.id, ...answer };
    } catch (error) {
      throw new Error(`Failed to create answer: ${error.message}`);
    }
  }

  async getAnswersByTopic(topicId, options = {}) {
    try {
      const { limit = 20 } = options;

      const answers = await this.queries.getAnswersByTopic(topicId, { limit });

      // Filter out deleted answers client-side
      const filteredAnswers = answers.filter((answer) => !answer.isDeleted);

      return {
        answers: filteredAnswers,
        lastDoc: null, // Simplified pagination
        hasMore: false,
      };
    } catch (error) {
      throw new Error(`Failed to get answers: ${error.message}`);
    }
  }
}

module.exports = new AnswerService();
