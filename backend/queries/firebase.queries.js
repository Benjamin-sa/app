/**
 * Firebase Query Abstraction Layer
 * Centralizes all Firebase operations to provide a clean separation between services and Firebase
 * All Firebase interactions should go through this abstraction layer
 */

const admin = require("firebase-admin");
const { firestore, auth, storage } = require("../config/firebase");
const { COLLECTIONS } = require("../models/forum.models");

class FirebaseQueries {
  constructor() {
    this.db = firestore;
    this.auth = auth;
    this.storage = storage;
    this.bucket = storage.bucket();
    this.FieldValue = admin.firestore.FieldValue;
  }

  // =====================
  // USER OPERATIONS
  // =====================

  /**
   * Create a new user profile
   */
  async createUser(uid, userData) {
    return await this.db
      .collection(COLLECTIONS.USERS)
      .doc(uid)
      .set(userData, { merge: true });
  }

  /**
   * Get user profile by UID
   */
  async getUserById(uid) {
    const doc = await this.db.collection(COLLECTIONS.USERS).doc(uid).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username) {
    const snapshot = await this.db
      .collection(COLLECTIONS.USERS)
      .where("username", "==", username)
      .limit(1)
      .get();

    return snapshot.empty
      ? null
      : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  /**
   * Update user profile
   */
  async updateUser(uid, updateData) {
    return await this.db
      .collection(COLLECTIONS.USERS)
      .doc(uid)
      .update({
        ...updateData,
        updatedAt: this.FieldValue.serverTimestamp(),
      });
  }

  /**
   * Update user activity timestamp
   */
  async updateUserActivity(uid) {
    return await this.db.collection(COLLECTIONS.USERS).doc(uid).update({
      lastActive: this.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Increment user statistics
   */
  async incrementUserStats(uid, field) {
    return await this.db
      .collection(COLLECTIONS.USERS)
      .doc(uid)
      .update({
        [field]: this.FieldValue.increment(1),
      });
  }

  /**
   * Get all users (for admin purposes)
   */
  async getAllUsers(limit = 50) {
    const snapshot = await this.db
      .collection(COLLECTIONS.USERS)
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // =====================
  // TOPIC OPERATIONS
  // =====================

  /**
   * Create a new topic
   */
  async createTopic(topicData) {
    return await this.db.collection(COLLECTIONS.TOPICS).add({
      ...topicData,
      createdAt: this.FieldValue.serverTimestamp(),
      updatedAt: this.FieldValue.serverTimestamp(),
      lastActivity: this.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Get topic by ID
   */
  async getTopicById(topicId) {
    // Validate topicId to prevent Firebase "invalid resource path" errors
    if (!topicId || typeof topicId !== "string" || topicId.trim() === "") {
      throw new Error("Invalid topic ID: must be a non-empty string");
    }

    const doc = await this.db
      .collection(COLLECTIONS.TOPICS)
      .doc(topicId.trim())
      .get();
    if (!doc.exists) return null;

    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      lastActivity: data.lastActivity?.toDate(),
    };
  }

  /**
   * Get topics with pagination and filtering
   */
  async getTopics(options = {}) {
    const {
      limit = 20,
      category = null,
      orderBy = "lastActivity",
      orderDirection = "desc",
    } = options;

    let query = this.db.collection(COLLECTIONS.TOPICS);

    if (category) {
      query = query.where("category", "==", category);
    }

    // Apply ordering and limit
    const snapshot = await query
      .orderBy(orderBy, orderDirection)
      .limit(parseInt(limit))
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastActivity: data.lastActivity?.toDate(),
      };
    });
  }

  /**
   * Update topic
   */
  async updateTopic(topicId, updateData) {
    return await this.db
      .collection(COLLECTIONS.TOPICS)
      .doc(topicId)
      .update({
        ...updateData,
        updatedAt: this.FieldValue.serverTimestamp(),
      });
  }

  /**
   * Increment topic view count
   */
  async incrementTopicViews(topicId) {
    return await this.db
      .collection(COLLECTIONS.TOPICS)
      .doc(topicId)
      .update({
        viewCount: this.FieldValue.increment(1),
        lastActivity: this.FieldValue.serverTimestamp(),
      });
  }

  /**
   * Update topic answer count
   */
  async updateTopicAnswerCount(topicId, increment = 1) {
    return await this.db
      .collection(COLLECTIONS.TOPICS)
      .doc(topicId)
      .update({
        answerCount: this.FieldValue.increment(increment),
        lastActivity: this.FieldValue.serverTimestamp(),
      });
  }

  /**
   * Search topics by title and content
   */
  async searchTopics(searchTerm, options = {}) {
    const { limit = 20, category = null } = options;

    let query = this.db
      .collection(COLLECTIONS.TOPICS)
      .where("isDeleted", "==", false);

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query
      .orderBy("lastActivity", "desc")
      .limit(100) // Get more docs to filter
      .get();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastActivity: data.lastActivity?.toDate(),
        };
      })
      .filter((topic) => {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = topic.title.toLowerCase().includes(searchLower);
        const contentMatch = topic.content.toLowerCase().includes(searchLower);
        const tagMatch = topic.tags?.some((tag) =>
          tag.toLowerCase().includes(searchLower)
        );
        return titleMatch || contentMatch || tagMatch;
      })
      .slice(0, parseInt(limit));
  }

  /**
   * Get forum statistics
   */
  async getForumStats() {
    const [topicsSnapshot, usersSnapshot] = await Promise.all([
      this.db
        .collection(COLLECTIONS.TOPICS)
        .where("isDeleted", "==", false)
        .get(),
      this.db.collection(COLLECTIONS.USERS).get(),
    ]);

    const totalViews = topicsSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().viewCount || 0);
    }, 0);

    const totalAnswers = topicsSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().answerCount || 0);
    }, 0);

    return {
      totalUsers: usersSnapshot.size,
      totalTopics: topicsSnapshot.size,
      totalAnswers,
      totalViews,
      lastUpdated: new Date(),
    };
  }

  // =====================
  // ANSWER OPERATIONS
  // =====================

  /**
   * Create a new answer
   */
  async createAnswer(answerData) {
    return await this.db.collection(COLLECTIONS.ANSWERS).add({
      ...answerData,
      createdAt: this.FieldValue.serverTimestamp(),
      updatedAt: this.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Get answers by topic ID
   */
  async getAnswersByTopic(topicId, options = {}) {
    const { limit = 20 } = options;

    const snapshot = await this.db
      .collection(COLLECTIONS.ANSWERS)
      .where("topicId", "==", topicId)
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Update answer
   */
  async updateAnswer(answerId, updateData) {
    return await this.db
      .collection(COLLECTIONS.ANSWERS)
      .doc(answerId)
      .update({
        ...updateData,
        updatedAt: this.FieldValue.serverTimestamp(),
      });
  }

  /**
   * Get answer by ID
   */
  async getAnswerById(answerId) {
    // Validate answerId to prevent Firebase "invalid resource path" errors
    if (!answerId || typeof answerId !== "string" || answerId.trim() === "") {
      throw new Error("Invalid answer ID: must be a non-empty string");
    }

    const doc = await this.db
      .collection(COLLECTIONS.ANSWERS)
      .doc(answerId.trim())
      .get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  // =====================
  // VOTING OPERATIONS
  // =====================

  /**
   * Create or update a vote
   */
  async upsertVote(voteData) {
    // Validate critical fields to prevent Firebase "invalid resource path" errors
    if (
      !voteData.userId ||
      typeof voteData.userId !== "string" ||
      voteData.userId.trim() === ""
    ) {
      throw new Error("Invalid user ID: must be a non-empty string");
    }
    if (
      !voteData.targetId ||
      typeof voteData.targetId !== "string" ||
      voteData.targetId.trim() === ""
    ) {
      throw new Error("Invalid target ID: must be a non-empty string");
    }

    const voteId = `${voteData.userId.trim()}_${voteData.targetId.trim()}`;
    return await this.db
      .collection(COLLECTIONS.VOTES)
      .doc(voteId)
      .set(
        {
          ...voteData,
          userId: voteData.userId.trim(),
          targetId: voteData.targetId.trim(),
          createdAt: this.FieldValue.serverTimestamp(),
          updatedAt: this.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }

  /**
   * Get user vote for a target
   */
  async getUserVote(userId, targetId) {
    // Validate parameters to prevent Firebase "invalid resource path" errors
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      throw new Error("Invalid user ID: must be a non-empty string");
    }
    if (!targetId || typeof targetId !== "string" || targetId.trim() === "") {
      throw new Error("Invalid target ID: must be a non-empty string");
    }

    const voteId = `${userId.trim()}_${targetId.trim()}`;
    const doc = await this.db.collection(COLLECTIONS.VOTES).doc(voteId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  /**
   * Delete a vote
   */
  async deleteVote(userId, targetId) {
    // Validate parameters to prevent Firebase "invalid resource path" errors
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      throw new Error("Invalid user ID: must be a non-empty string");
    }
    if (!targetId || typeof targetId !== "string" || targetId.trim() === "") {
      throw new Error("Invalid target ID: must be a non-empty string");
    }

    const voteId = `${userId.trim()}_${targetId.trim()}`;
    return await this.db.collection(COLLECTIONS.VOTES).doc(voteId).delete();
  }

  /**
   * Update target vote counts
   */
  async updateVoteCounts(targetId, targetType, voteChanges) {
    // Validate parameters to prevent Firebase "invalid resource path" errors
    if (!targetId || typeof targetId !== "string" || targetId.trim() === "") {
      throw new Error("Invalid target ID: must be a non-empty string");
    }
    if (!["topic", "answer"].includes(targetType)) {
      throw new Error('Invalid target type: must be "topic" or "answer"');
    }

    const collection =
      targetType === "topic" ? COLLECTIONS.TOPICS : COLLECTIONS.ANSWERS;

    return await this.db
      .collection(collection)
      .doc(targetId.trim())
      .update({
        "votes.upvotes": this.FieldValue.increment(voteChanges.upvotes || 0),
        "votes.downvotes": this.FieldValue.increment(
          voteChanges.downvotes || 0
        ),
        "votes.score": this.FieldValue.increment(voteChanges.score || 0),
      });
  }

  // =====================
  // CATEGORY OPERATIONS
  // =====================

  /**
   * Get all categories
   */
  async getCategories() {
    const snapshot = await this.db
      .collection(COLLECTIONS.CATEGORIES)
      .orderBy("sortOrder")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Create or update category
   */
  async upsertCategory(categoryId, categoryData) {
    return await this.db
      .collection(COLLECTIONS.CATEGORIES)
      .doc(categoryId)
      .set(categoryData, { merge: true });
  }

  /**
   * Update category topic count
   */
  async updateCategoryTopicCount(categoryId, increment = 1) {
    return await this.db
      .collection(COLLECTIONS.CATEGORIES)
      .doc(categoryId)
      .update({
        topicCount: this.FieldValue.increment(increment),
      });
  }

  // =====================
  // STATS OPERATIONS
  // =====================

  /**
   * Get global stats
   */
  async getGlobalStats() {
    const doc = await this.db.collection(COLLECTIONS.STATS).doc("global").get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * Update global stats
   */
  async updateGlobalStats(statsData) {
    return await this.db
      .collection(COLLECTIONS.STATS)
      .doc("global")
      .set(
        {
          ...statsData,
          lastUpdated: this.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }

  // =====================
  // STORAGE OPERATIONS
  // =====================

  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(buffer, filePath, metadata = {}) {
    const file = this.bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        ...metadata,
        cacheControl: "public, max-age=31536000", // 1 year cache
      },
      public: true,
    });

    // Get the public URL
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500", // Far future date for public access
    });

    return {
      url: url.split("?")[0], // Remove query parameters for cleaner URL
      storagePath: filePath,
    };
  }

  /**
   * Delete file from Firebase Storage
   */
  async deleteFile(storagePath) {
    const file = this.bucket.file(storagePath);
    return await file.delete();
  }

  /**
   * Get file download URL
   */
  async getFileUrl(storagePath) {
    const file = this.bucket.file(storagePath);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });
    return url;
  }

  // =====================
  // BATCH OPERATIONS
  // =====================

  /**
   * Create a batch for multiple operations
   */
  createBatch() {
    return this.db.batch();
  }

  /**
   * Execute a batch
   */
  async executeBatch(batch) {
    return await batch.commit();
  }

  // =====================
  // TRANSACTION OPERATIONS
  // =====================

  /**
   * Run a transaction
   */
  async runTransaction(updateFunction) {
    return await this.db.runTransaction(updateFunction);
  }

  // =====================
  // ADMIN/AUTH OPERATIONS
  // =====================

  /**
   * Verify Firebase ID token
   */
  async verifyIdToken(token) {
    return await this.auth.verifyIdToken(token);
  }

  /**
   * Create Firebase user
   */
  async createAuthUser(userData) {
    return await this.auth.createUser(userData);
  }

  /**
   * Update Firebase user
   */
  async updateAuthUser(uid, userData) {
    return await this.auth.updateUser(uid, userData);
  }

  /**
   * Delete Firebase user
   */
  async deleteAuthUser(uid) {
    return await this.auth.deleteUser(uid);
  }

  // =====================
  // INITIALIZATION METHODS
  // =====================

  /**
   * Initialize forum categories using batch operation
   */
  async initializeCategories(categories) {
    const batch = this.db.batch();

    for (const category of categories) {
      const categoryRef = this.db
        .collection(COLLECTIONS.CATEGORIES)
        .doc(category.id);
      batch.set(categoryRef, category, { merge: true });
    }

    await batch.commit();
    return true;
  }

  /**
   * Initialize forum statistics
   */
  async initializeStats(statsData = {}) {
    const defaultStats = {
      totalUsers: 0,
      totalTopics: 0,
      totalAnswers: 0,
      totalViews: 0,
      lastUpdated: this.FieldValue.serverTimestamp(),
      ...statsData,
    };

    await this.db
      .collection(COLLECTIONS.STATS)
      .doc("global")
      .set(defaultStats, { merge: true });

    return true;
  }

  /**
   * Create admin user for initialization
   */
  async createAdminUser(adminData) {
    await this.db
      .collection(COLLECTIONS.USERS)
      .doc(adminData.uid)
      .set(
        {
          ...adminData,
          joinedDate: this.FieldValue.serverTimestamp(),
          lastActive: this.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return true;
  }

  // =====================
  // UTILITY METHODS
  // =====================

  /**
   * Get server timestamp
   */
  getServerTimestamp() {
    return this.FieldValue.serverTimestamp();
  }

  /**
   * Get increment value
   */
  getIncrement(value = 1) {
    return this.FieldValue.increment(value);
  }

  /**
   * Get array union
   */
  getArrayUnion(...elements) {
    return this.FieldValue.arrayUnion(...elements);
  }

  /**
   * Get array remove
   */
  getArrayRemove(...elements) {
    return this.FieldValue.arrayRemove(...elements);
  }
}

module.exports = new FirebaseQueries();
