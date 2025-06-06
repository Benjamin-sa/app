/**
 * Forum Service - Main coordinator with caching
 */

const UserService = require("./forum/user.service");
const TopicService = require("./forum/topic.service");
const AnswerService = require("./forum/answer.service");
const VotingService = require("./forum/voting.service");
const CacheService = require("./cache.service");

class ForumService {
  constructor() {
    this.userService = UserService;
    this.topicService = TopicService;
    this.answerService = AnswerService;
    this.votingService = VotingService;
    this.cache = CacheService;
  }

  // ==================== USER OPERATIONS ====================

  async createUserProfile(userData) {
    const result = await this.userService.createUserProfile(userData);
    await this.cache.invalidatePattern(`user:${userData.uid}:*`);
    return result;
  }

  async getUserProfile(uid) {
    const cacheKey = `user:${uid}:profile`;
    let profile = await this.cache.get(cacheKey);

    if (!profile) {
      profile = await this.userService.getUserProfile(uid);
      if (profile) {
        await this.cache.set(cacheKey, profile, 300); // 5 minutes
      }
    }
    return profile;
  }

  async getUserByUsername(username) {
    const cacheKey = `user:username:${username}`;
    let user = await this.cache.get(cacheKey);

    if (!user) {
      user = await this.userService.getUserByUsername(username);
      if (user) {
        await this.cache.set(cacheKey, user, 300);
      }
    }
    return user;
  }

  async updateUserActivity(uid) {
    await this.userService.updateUserActivity(uid);
    await this.cache.invalidatePattern(`user:${uid}:*`);
  }

  // ==================== TOPIC OPERATIONS ====================

  async createTopic(topicData, uploadedFiles = []) {
    const result = await this.topicService.createTopic(
      topicData,
      uploadedFiles
    );
    await this.cache.invalidatePattern("topics:*");
    await this.cache.invalidatePattern("stats:*");
    return result;
  }

  async getTopics(options = {}) {
    const cacheKey = `topics:${JSON.stringify(options)}`;
    let topics = await this.cache.get(cacheKey);

    if (!topics) {
      topics = await this.topicService.getTopics(options);
      await this.cache.set(cacheKey, topics, 120); // 2 minutes
    }
    return topics;
  }

  async getTopicById(topicId, userId = null) {
    const cacheKey = `topic:${topicId}:${userId || "anonymous"}`;
    let topic = await this.cache.get(cacheKey);

    if (!topic) {
      topic = await this.topicService.getTopicById(topicId, userId);
      if (topic) {
        await this.cache.set(cacheKey, topic, 300);
      }
    } else {
      // Still increment view count but don't wait for it
      this.topicService.incrementViewCount(topicId);
    }
    return topic;
  }

  async searchTopics(searchTerm, options = {}) {
    const cacheKey = `search:${searchTerm}:${JSON.stringify(options)}`;
    let results = await this.cache.get(cacheKey);

    if (!results) {
      results = await this.topicService.searchTopics(searchTerm, options);
      await this.cache.set(cacheKey, results, 300);
    }
    return results;
  }

  // ==================== ANSWER OPERATIONS ====================

  async createAnswer(answerData, images = []) {
    const result = await this.answerService.createAnswer(answerData, images);
    await this.cache.invalidatePattern(`topic:${answerData.topicId}:*`);
    await this.cache.invalidatePattern(`answers:${answerData.topicId}:*`);
    return result;
  }

  async getAnswersByTopic(topicId, options = {}) {
    const cacheKey = `answers:${topicId}:${JSON.stringify(options)}`;
    let answers = await this.cache.get(cacheKey);

    if (!answers) {
      answers = await this.answerService.getAnswersByTopic(topicId);
      await this.cache.set(cacheKey, answers, 180); // 3 minutes
    }
    return answers;
  }

  // ==================== VOTING OPERATIONS ====================

  async vote(userId, targetId, targetType, voteType) {
    const result = await this.votingService.vote(
      userId,
      targetId,
      targetType,
      voteType
    );
    await this.cache.invalidatePattern(`${targetType}:${targetId}*`);
    await this.cache.invalidatePattern(`vote:${userId}:${targetId}`);
    return result;
  }

  async getUserVote(userId, targetId) {
    const cacheKey = `vote:${userId}:${targetId}`;
    let vote = await this.cache.get(cacheKey);

    if (vote === undefined) {
      vote = await this.votingService.getUserVote(userId, targetId);
      await this.cache.set(cacheKey, vote, 600); // 10 minutes
    }
    return vote;
  }

  // ==================== STATISTICS ====================

  async getForumStats() {
    const cacheKey = "stats:forum";
    let stats = await this.cache.get(cacheKey);

    if (!stats) {
      stats = await this.topicService.getForumStats();
      await this.cache.set(cacheKey, stats, 1800); // 30 minutes
    }
    return stats;
  }
}

module.exports = new ForumService();
