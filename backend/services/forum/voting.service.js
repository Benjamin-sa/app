/**
 * Voting Service for Forum
 * Handles all voting-related operations
 */

const { firestore } = require("../../config/firebase");
const admin = require("firebase-admin");
const { COLLECTIONS } = require("../../models/forum.models");

class VotingService {
  constructor() {
    this.db = firestore;
  }

  async vote(userId, targetId, targetType, voteType) {
    try {
      // Handle null voteType for vote removal
      if (voteType && !["up", "down"].includes(voteType)) {
        throw new Error("Invalid vote type. Must be 'up', 'down', or null");
      }

      if (!["topic", "answer"].includes(targetType)) {
        throw new Error("Invalid target type");
      }

      const voteId = `${userId}_${targetId}`;
      const voteRef = this.db.collection(COLLECTIONS.VOTES).doc(voteId);
      const targetCollection =
        targetType === "topic" ? COLLECTIONS.TOPICS : COLLECTIONS.ANSWERS;
      const targetRef = this.db.collection(targetCollection).doc(targetId);

      let result = {};

      await this.db.runTransaction(async (transaction) => {
        const voteDoc = await transaction.get(voteRef);
        const targetDoc = await transaction.get(targetRef);

        if (!targetDoc.exists) {
          throw new Error(`${targetType} not found`);
        }

        const currentVotes = targetDoc.data().votes || {
          upvotes: 0,
          downvotes: 0,
          score: 0,
        };
        let newVotes = { ...currentVotes };
        let userVote = null;

        if (voteDoc.exists) {
          const existingVote = voteDoc.data();

          if (voteType === null || existingVote.voteType === voteType) {
            // Remove vote
            transaction.delete(voteRef);
            if (existingVote.voteType === "up") {
              newVotes.upvotes = Math.max(0, newVotes.upvotes - 1);
            } else if (existingVote.voteType === "down") {
              newVotes.downvotes = Math.max(0, newVotes.downvotes - 1);
            }
            userVote = null;
          } else {
            // Change vote
            transaction.update(voteRef, {
              voteType,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            if (voteType === "up") {
              newVotes.upvotes += 1;
              if (existingVote.voteType === "down") {
                newVotes.downvotes = Math.max(0, newVotes.downvotes - 1);
              }
            } else if (voteType === "down") {
              newVotes.downvotes += 1;
              if (existingVote.voteType === "up") {
                newVotes.upvotes = Math.max(0, newVotes.upvotes - 1);
              }
            }
            userVote = voteType;
          }
        } else if (voteType) {
          // New vote (only if voteType is not null)
          transaction.set(voteRef, {
            userId,
            targetId,
            targetType,
            voteType,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          if (voteType === "up") {
            newVotes.upvotes += 1;
          } else if (voteType === "down") {
            newVotes.downvotes += 1;
          }
          userVote = voteType;
        }

        newVotes.score = newVotes.upvotes - newVotes.downvotes;
        transaction.update(targetRef, {
          votes: newVotes,
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        });

        result = {
          success: true,
          newVoteCount: newVotes.score,
          userVote: userVote,
          upvotes: newVotes.upvotes,
          downvotes: newVotes.downvotes,
        };
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to vote: ${error.message}`);
    }
  }

  async getUserVote(userId, targetId) {
    try {
      const voteId = `${userId}_${targetId}`;
      const voteDoc = await this.db
        .collection(COLLECTIONS.VOTES)
        .doc(voteId)
        .get();

      if (voteDoc.exists) {
        const voteData = voteDoc.data();
        return voteData.voteType;
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to get user vote: ${error.message}`);
    }
  }
}

module.exports = new VotingService();
