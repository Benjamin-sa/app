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

  /**
   * Centralized error handling wrapper
   * Catches Firebase errors and throws them up to the calling service
   */
  async executeQuery(queryFunction, errorContext = "Firebase operation") {
    try {
      return await queryFunction();
    } catch (error) {
      throw new Error(`${errorContext}: ${error.message}`);
    }
  }

  // =====================
  // USER OPERATIONS
  // =====================

  /**
   * Create a new user profile
   */
  async createUser(uid, userData) {
    return await this.executeQuery(
      () =>
        this.db
          .collection(COLLECTIONS.USERS)
          .doc(uid)
          .set(userData, { merge: true }),
      "Failed to create user"
    );
  }

  /**
   * Get user profile by UID
   */
  async getUserById(uid) {
    return await this.executeQuery(async () => {
      const doc = await this.db.collection(COLLECTIONS.USERS).doc(uid).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }, "Failed to get user by ID");
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username) {
    return await this.executeQuery(async () => {
      const snapshot = await this.db
        .collection(COLLECTIONS.USERS)
        .where("username", "==", username)
        .limit(1)
        .get();

      return snapshot.empty
        ? null
        : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }, "Failed to get user by username");
  }

  /**
   * Update user profile
   */
  async updateUser(uid, updateData) {
    return await this.executeQuery(
      () =>
        this.db
          .collection(COLLECTIONS.USERS)
          .doc(uid)
          .update({
            ...updateData,
            updatedAt: this.FieldValue.serverTimestamp(),
          }),
      "Failed to update user"
    );
  }

  /**
   * Update user activity timestamp
   */
  async updateUserActivity(uid) {
    return await this.executeQuery(
      () =>
        this.db.collection(COLLECTIONS.USERS).doc(uid).update({
          lastActive: this.FieldValue.serverTimestamp(),
        }),
      "Failed to update user activity"
    );
  }

  /**
   * Increment user statistics
   */
  async incrementUserStats(uid, field) {
    return await this.executeQuery(
      () =>
        this.db
          .collection(COLLECTIONS.USERS)
          .doc(uid)
          .update({
            [field]: this.FieldValue.increment(1),
          }),
      "Failed to increment user stats"
    );
  }

  // =====================
  // TOPIC OPERATIONS
  // =====================

  /**
   * Create a new topic
   */
  async createTopic(topicData) {
    return await this.executeQuery(async () => {
      // Get a document reference with auto-generated ID
      const docRef = this.db.collection(COLLECTIONS.TOPICS).doc();

      // Ensure no server timestamps in nested objects/arrays
      const cleanTopicData = {
        ...topicData,
        id: docRef.id, // Include the auto-generated ID in the document data
        // Server timestamps should only be at the root level
        createdAt: this.FieldValue.serverTimestamp(),
        updatedAt: this.FieldValue.serverTimestamp(),
        lastActivity: this.FieldValue.serverTimestamp(),
      };

      await docRef.set(cleanTopicData);
      return docRef; // Return the document reference, not the WriteResult
    }, "FIREBASE_QUERIES_ERROR: Failed to create topic in Firestore");
  }

  /**
   * Get topic by ID
   */
  async getTopicById(topicId) {
    return await this.executeQuery(async () => {
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
    }, "Failed to get topic by ID");
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
    return await this.executeQuery(
      () =>
        this.db
          .collection(COLLECTIONS.TOPICS)
          .doc(topicId)
          .update({
            ...updateData,
            updatedAt: this.FieldValue.serverTimestamp(),
          }),
      "Failed to update topic"
    );
  }

  /**
   * Increment topic view count
   */
  async incrementTopicViews(topicId) {
    return await this.executeQuery(
      () =>
        this.db
          .collection(COLLECTIONS.TOPICS)
          .doc(topicId)
          .update({
            viewCount: this.FieldValue.increment(1),
            lastActivity: this.FieldValue.serverTimestamp(),
          }),
      "Failed to increment topic views"
    );
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

  // =====================
  // ANSWER OPERATIONS
  // =====================

  /**
   * Create a new answer
   */
  async createAnswer(answerData) {
    return await this.executeQuery(async () => {
      // Get a document reference with auto-generated ID
      const docRef = this.db.collection(COLLECTIONS.ANSWERS).doc();

      const cleanAnswerData = {
        ...answerData,
        id: docRef.id, // Include the auto-generated ID in the document data
        createdAt: this.FieldValue.serverTimestamp(),
        updatedAt: this.FieldValue.serverTimestamp(),
      };

      await docRef.set(cleanAnswerData);
      return docRef; // Return the document reference, not the WriteResult
    }, "Failed to create answer");
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
    return await this.executeQuery(async () => {
      const doc = await this.db
        .collection(COLLECTIONS.ANSWERS)
        .doc(answerId.trim())
        .get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }, "Failed to get answer by ID");
  }

  // =====================
  // VOTING OPERATIONS
  // =====================

  /**
   * Get user vote for a target
   */
  async getUserVote(userId, targetId) {
    return await this.executeQuery(async () => {
      const voteId = `${userId.trim()}_${targetId.trim()}`;
      const doc = await this.db.collection(COLLECTIONS.VOTES).doc(voteId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }, "Failed to get user vote");
  }

  /**
   * Delete a vote
   */
  async deleteVote(userId, targetId) {
    return await this.executeQuery(async () => {
      const voteId = `${userId.trim()}_${targetId.trim()}`;
      return await this.db.collection(COLLECTIONS.VOTES).doc(voteId).delete();
    }, "Failed to delete vote");
  }

  /**
   * Get all votes for a specific target
   */
  async getVotesByTarget(targetId, targetType) {
    return await this.executeQuery(async () => {
      const snapshot = await this.db
        .collection(COLLECTIONS.VOTES)
        .where("targetId", "==", targetId.trim())
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }, "Failed to get votes by target");
  }

  /**
   * Create or update a vote (handles all vote logic)
   */
  async createOrUpdateVote(userId, targetId, targetType, voteType) {
    return await this.executeQuery(async () => {
      const voteId = `${userId.trim()}_${targetId.trim()}`;

      if (voteType === null) {
        // Remove vote if voteType is null
        await this.db.collection(COLLECTIONS.VOTES).doc(voteId).delete();
      } else {
        // Create or update vote
        const voteData = {
          userId: userId.trim(),
          targetId: targetId.trim(),
          targetType,
          voteType,
          createdAt: this.FieldValue.serverTimestamp(),
          updatedAt: this.FieldValue.serverTimestamp(),
        };

        await this.db
          .collection(COLLECTIONS.VOTES)
          .doc(voteId)
          .set(voteData, { merge: true });
      }
    }, "Failed to create or update vote");
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
  // UTILITY METHODS
  // =====================

  /**
   * Get server timestamp
   */
  getServerTimestamp() {
    return this.FieldValue.serverTimestamp();
  }

  // =====================
  // BIKE OPERATIONS
  // =====================

  /**
   * Create a new bike
   */
  async createBike(bikeData) {
    return await this.executeQuery(async () => {
      // Get a document reference with auto-generated ID
      const docRef = this.db.collection(COLLECTIONS.BIKES).doc();

      const cleanBikeData = {
        ...bikeData,
        id: docRef.id, // Include the auto-generated ID in the document data
        createdAt: this.FieldValue.serverTimestamp(),
        updatedAt: this.FieldValue.serverTimestamp(),
      };

      await docRef.set(cleanBikeData);
      return docRef; // Return the document reference
    }, "Failed to create bike");
  }

  /**
   * Get bike by ID
   */
  async getBikeById(bikeId) {
    return await this.executeQuery(async () => {
      const doc = await this.db
        .collection(COLLECTIONS.BIKES)
        .doc(bikeId.trim())
        .get();

      if (!doc.exists) return null;

      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    }, "Failed to get bike by ID");
  }

  /**
   * Get all bikes for a specific user
   */
  async getBikesByUserId(userId, options = {}) {
    const {
      limit = 50,
      orderBy = "createdAt",
      orderDirection = "desc",
    } = options;

    return await this.executeQuery(async () => {
      const snapshot = await this.db
        .collection(COLLECTIONS.BIKES)
        .where("userId", "==", userId)
        .where("isDeleted", "==", false)
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
        };
      });
    }, "Failed to get bikes by user ID");
  }

  /**
   * Update bike
   */
  async updateBike(bikeId, updateData) {
    return await this.executeQuery(
      () =>
        this.db
          .collection(COLLECTIONS.BIKES)
          .doc(bikeId)
          .update({
            ...updateData,
            updatedAt: this.FieldValue.serverTimestamp(),
          }),
      "Failed to update bike"
    );
  }

  /**
   * Soft delete bike
   */
  async deleteBike(bikeId) {
    return await this.executeQuery(
      () =>
        this.db.collection(COLLECTIONS.BIKES).doc(bikeId).update({
          isDeleted: true,
          updatedAt: this.FieldValue.serverTimestamp(),
        }),
      "Failed to delete bike"
    );
  }

  /**
   * Count bikes by user ID
   */
  async countBikesByUserId(userId) {
    return await this.executeQuery(async () => {
      const snapshot = await this.db
        .collection(COLLECTIONS.BIKES)
        .where("userId", "==", userId)
        .where("isDeleted", "==", false)
        .get();

      return snapshot.size;
    }, "Failed to count user bikes");
  }

  /**
   * Get featured bikes
   */
  async getFeaturedBikes(options = {}) {
    const {
      limit = 10,
      orderBy = "createdAt",
      orderDirection = "desc",
    } = options;

    return await this.executeQuery(async () => {
      const snapshot = await this.db
        .collection(COLLECTIONS.BIKES)
        .where("isDeleted", "==", false)
        .where("is_featured", "==", true)
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
        };
      });
    }, "Failed to get featured bikes");
  }

  /**
   * Increment bike view count
   */
  async incrementBikeViews(bikeId) {
    return await this.executeQuery(
      () =>
        this.db
          .collection(COLLECTIONS.BIKES)
          .doc(bikeId)
          .update({
            view_count: this.FieldValue.increment(1),
          }),
      "Failed to increment bike views"
    );
  }

  /**
   * Toggle bike featured status
   */
  async toggleBikeFeaturedStatus(bikeId, isFeatured) {
    return await this.executeQuery(
      () =>
        this.db.collection(COLLECTIONS.BIKES).doc(bikeId).update({
          is_featured: isFeatured,
          updatedAt: this.FieldValue.serverTimestamp(),
        }),
      "Failed to toggle bike featured status"
    );
  }

  /**
   * Update user bike count
   */
  async updateUserBikeCount(userId, count) {
    return await this.executeQuery(
      () =>
        this.db.collection(COLLECTIONS.USERS).doc(userId).update({
          bikes_count: count,
          updatedAt: this.FieldValue.serverTimestamp(),
        }),
      "Failed to update user bike count"
    );
  }

  /**
   * Get all bikes with pagination and filtering
   */
  async getAllBikes(options = {}) {
    const {
      page = 1,
      limit = 12,
      sort = "recent",
      search = "",
      engineSize = "",
    } = options;

    try {
      let query = this.db
        .collection(COLLECTIONS.BIKES)
        .where("isDeleted", "==", false);

      // Add engine size filter first (before search to optimize query)
      if (engineSize && engineSize !== "" && engineSize !== "other") {
        const engineSizeNum = parseInt(engineSize);
        if (!isNaN(engineSizeNum)) {
          query = query.where("engine_size", "==", engineSizeNum);
        }
      }

      // Add sorting - use correct field names
      switch (sort) {
        case "popular":
          query = query.orderBy("view_count", "desc");
          break;
        case "featured":
          query = query
            .where("is_featured", "==", true)
            .orderBy("createdAt", "desc");
          break;
        case "recent":
        default:
          query = query.orderBy("createdAt", "desc");
          break;
      }

      // For pagination, we'll get more documents and handle it in memory
      const snapshot = await query.limit(1000).get();

      let allBikes = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        allBikes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      // Apply search filter in memory
      if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        allBikes = allBikes.filter((bike) => {
          const nameMatch = bike.name?.toLowerCase().includes(searchLower);
          const brandMatch = bike.brand?.toLowerCase().includes(searchLower);
          const modelMatch = bike.model?.toLowerCase().includes(searchLower);
          return nameMatch || brandMatch || modelMatch;
        });
      }

      // Apply "other" engine size filter in memory
      if (engineSize === "other") {
        allBikes = allBikes.filter((bike) => {
          const engineSize = bike.engine_size;
          return engineSize && ![50, 125, 250].includes(engineSize);
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedBikes = allBikes.slice(startIndex, endIndex);
      const hasMore = endIndex < allBikes.length;

      return {
        bikes: paginatedBikes,
        hasMore,
        total: allBikes.length,
      };
    } catch (error) {
      console.error("Error in getAllBikes query:", error);
      throw error;
    }
  }
}

module.exports = new FirebaseQueries();
