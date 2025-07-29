/**
 * Firebase Query Abstraction Layer - Refactored
 * Centralizes all Firebase operations using domain-specific query classes
 * Maintains backward compatibility with existing codebase
 */

const UserQueries = require("./domains/UserQueries");
const ForumQueries = require("./domains/ForumQueries");
const BikeQueries = require("./domains/BikeQueries");
const VotingQueries = require("./domains/VotingQueries");
const MessagingQueries = require("./domains/MessagingQueries");
const CategoryQueries = require("./domains/CategoryQueries");
const StatsQueries = require("./domains/StatsQueries");
const StorageQueries = require("./domains/StorageQueries");
const BaseFirebaseQueries = require("./base/BaseFirebaseQueries");

class FirebaseQueries extends BaseFirebaseQueries {
  constructor() {
    super();

    // Initialize domain-specific query instances
    this.userQueries = new UserQueries();
    this.forumQueries = new ForumQueries();
    this.bikeQueries = new BikeQueries();
    this.votingQueries = new VotingQueries();
    this.messagingQueries = new MessagingQueries();
    this.categoryQueries = new CategoryQueries();
    this.statsQueries = new StatsQueries();
    this.storageQueries = new StorageQueries();
  }

  // =====================
  // USER OPERATIONS - Delegate to UserQueries
  // =====================

  async createUser(uid, userData) {
    return await this.userQueries.createUser(uid, userData);
  }

  async getUserById(uid) {
    return await this.userQueries.getUserById(uid);
  }

  async getUserByUsername(username) {
    return await this.userQueries.getUserByUsername(username);
  }

  async updateUser(uid, updateData) {
    return await this.userQueries.updateUser(uid, updateData);
  }

  async updateUserActivity(uid) {
    return await this.userQueries.updateUserActivity(uid);
  }

  async incrementUserStats(uid, field) {
    return await this.userQueries.incrementUserStats(uid, field);
  }

  async updateUserBikeCount(userId, count) {
    return await this.userQueries.updateUserBikeCount(userId, count);
  }

  // =====================
  // TOPIC OPERATIONS - Delegate to ForumQueries
  // =====================

  async createTopic(topicData) {
    return await this.forumQueries.createTopic(topicData);
  }

  async getTopicById(topicId) {
    return await this.forumQueries.getTopicById(topicId);
  }

  async getTopics(options = {}) {
    return await this.forumQueries.getTopics(options);
  }

  async updateTopic(topicId, updateData) {
    return await this.forumQueries.updateTopic(topicId, updateData);
  }

  async incrementTopicViews(topicId) {
    return await this.forumQueries.incrementTopicViews(topicId);
  }

  async searchTopics(searchTerm, options = {}) {
    return await this.forumQueries.searchTopics(searchTerm, options);
  }

  // =====================
  // ANSWER OPERATIONS - Delegate to ForumQueries
  // =====================

  async createAnswer(answerData) {
    return await this.forumQueries.createAnswer(answerData);
  }

  async getAnswersByTopic(topicId, options = {}) {
    return await this.forumQueries.getAnswersByTopic(topicId, options);
  }

  async updateAnswer(answerId, updateData) {
    return await this.forumQueries.updateAnswer(answerId, updateData);
  }

  async deleteAnswer(answerId) {
    return await this.forumQueries.deleteAnswer(answerId);
  }

  async getAnswerById(answerId) {
    return await this.forumQueries.getAnswerById(answerId);
  }

  // =====================
  // VOTING OPERATIONS - Delegate to VotingQueries
  // =====================

  async getUserVote(userId, targetId) {
    return await this.votingQueries.getUserVote(userId, targetId);
  }

  async deleteVote(userId, targetId) {
    return await this.votingQueries.deleteVote(userId, targetId);
  }

  async getVotesByTarget(targetId, targetType) {
    return await this.votingQueries.getVotesByTarget(targetId, targetType);
  }

  async createOrUpdateVote(userId, targetId, targetType, voteType) {
    return await this.votingQueries.createOrUpdateVote(
      userId,
      targetId,
      targetType,
      voteType
    );
  }

  // =====================
  // CATEGORY OPERATIONS - Delegate to CategoryQueries
  // =====================

  async getCategories() {
    return await this.categoryQueries.getCategories();
  }

  async upsertCategory(categoryId, categoryData) {
    return await this.categoryQueries.upsertCategory(categoryId, categoryData);
  }

  async updateCategoryTopicCount(categoryId, increment = 1) {
    return await this.categoryQueries.updateCategoryTopicCount(
      categoryId,
      increment
    );
  }

  async updateCategoryViews(categoryId, increment = 1) {
    return await this.categoryQueries.updateCategoryViews(categoryId, increment);
  }

  async updateCategoryLastActivity(categoryId, activityData) {
    return await this.categoryQueries.updateCategoryLastActivity(
      categoryId,
      activityData
    );
  }

  async getCategoryStatistics(categoryId) {
    return await this.categoryQueries.getCategoryStatistics(categoryId);
  }

  async refreshAllCategoryStatistics() {
    return await this.categoryQueries.refreshAllCategoryStatistics();
  }

  // =====================
  // STATS OPERATIONS - Delegate to StatsQueries
  // =====================

  async getGlobalStats() {
    return await this.statsQueries.getGlobalStats();
  }

  async updateGlobalStats(statsData) {
    return await this.statsQueries.updateGlobalStats(statsData);
  }

  // =====================
  // STORAGE OPERATIONS - Delegate to StorageQueries
  // =====================

  async uploadFile(buffer, filePath, metadata = {}) {
    return await this.storageQueries.uploadFile(buffer, filePath, metadata);
  }

  async deleteFile(storagePath) {
    return await this.storageQueries.deleteFile(storagePath);
  }

  // =====================
  // BIKE OPERATIONS - Delegate to BikeQueries
  // =====================

  async createBike(bikeData) {
    return await this.bikeQueries.createBike(bikeData);
  }

  async getBikeById(bikeId) {
    return await this.bikeQueries.getBikeById(bikeId);
  }

  async getBikesByUserId(userId, options = {}) {
    return await this.bikeQueries.getBikesByUserId(userId, options);
  }

  async updateBike(bikeId, updateData) {
    return await this.bikeQueries.updateBike(bikeId, updateData);
  }

  async deleteBike(bikeId) {
    return await this.bikeQueries.deleteBike(bikeId);
  }

  async countBikesByUserId(userId) {
    return await this.bikeQueries.countBikesByUserId(userId);
  }

  async getFeaturedBikes(options = {}) {
    return await this.bikeQueries.getFeaturedBikes(options);
  }

  async incrementBikeViews(bikeId) {
    return await this.bikeQueries.incrementBikeViews(bikeId);
  }

  async toggleBikeFeaturedStatus(bikeId, isFeatured) {
    return await this.bikeQueries.toggleBikeFeaturedStatus(bikeId, isFeatured);
  }

  async getAllBikes(options = {}) {
    return await this.bikeQueries.getAllBikes(options);
  }

  // =====================
  // MESSAGING OPERATIONS - Delegate to MessagingQueries
  // =====================

  async createConversation(conversationData) {
    return await this.messagingQueries.createConversation(conversationData);
  }

  async getConversationBetweenUsers(userId1, userId2) {
    return await this.messagingQueries.getConversationBetweenUsers(
      userId1,
      userId2
    );
  }

  async getConversationById(conversationId) {
    return await this.messagingQueries.getConversationById(conversationId);
  }

  async getUserConversations(userId, options = {}) {
    return await this.messagingQueries.getUserConversations(userId, options);
  }

  async createMessage(messageData) {
    return await this.messagingQueries.createMessage(messageData);
  }

  async getConversationMessages(conversationId, options = {}) {
    return await this.messagingQueries.getConversationMessages(
      conversationId,
      options
    );
  }

  async markMessageAsRead(messageId) {
    return await this.messagingQueries.markMessageAsRead(messageId);
  }

  async updateConversationLastMessage(conversationId, messageData) {
    return await this.messagingQueries.updateConversationLastMessage(
      conversationId,
      messageData
    );
  }
}

module.exports = new FirebaseQueries();
