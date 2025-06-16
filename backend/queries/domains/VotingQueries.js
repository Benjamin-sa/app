/**
 * Voting Queries
 * Handles all voting-related Firebase operations
 */

const BaseFirebaseQueries = require("../base/BaseFirebaseQueries");
const { COLLECTIONS } = require("../../models/forum.models");

class VotingQueries extends BaseFirebaseQueries {
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
}

module.exports = VotingQueries;
