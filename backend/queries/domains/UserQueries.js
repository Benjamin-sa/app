/**
 * User Queries
 * Handles all user-related Firebase operations
 */

const BaseFirebaseQueries = require("../base/BaseFirebaseQueries");
const { COLLECTIONS } = require("../../models/forum.models");

class UserQueries extends BaseFirebaseQueries {
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
    return await this.getDocumentById(
      COLLECTIONS.USERS,
      uid,
      "Failed to get user by ID"
    );
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
    return await this.updateDocument(
      COLLECTIONS.USERS,
      uid,
      updateData,
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
    return await this.incrementField(
      COLLECTIONS.USERS,
      uid,
      field,
      1,
      "Failed to increment user stats"
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
}

module.exports = UserQueries;
