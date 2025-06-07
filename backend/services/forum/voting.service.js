/**
 * Voting Service for Forum
 * Handles all voting-related operations
 */

const firebaseQueries = require("../../queries/firebase.queries");
const { COLLECTIONS, Vote } = require("../../models/forum.models");

class VotingService {
  constructor() {
    this.queries = firebaseQueries;
  }

  async vote(userId, targetId, targetType, voteType) {
    try {
      // Validate required parameters
      if (!userId) {
        throw new Error("VOTING_SERVICE_VALIDATION_ERROR: User ID is required");
      }

      if (!targetId) {
        throw new Error(
          "VOTING_SERVICE_VALIDATION_ERROR: Target ID is required"
        );
      }

      // Handle null voteType for vote removal
      if (voteType && !["up", "down"].includes(voteType)) {
        throw new Error(
          "VOTING_SERVICE_VALIDATION_ERROR: Invalid vote type. Must be 'up', 'down', or null"
        );
      }

      if (!["topic", "answer"].includes(targetType)) {
        throw new Error("VOTING_SERVICE_VALIDATION_ERROR: Invalid target type");
      }

      // Use transaction to ensure data consistency
      return await this.queries.runTransaction(async (transaction) => {
        // Get current vote and target document
        const existingVote = await this.queries.getUserVote(userId, targetId);
        const target =
          targetType === "topic"
            ? await this.queries.getTopicById(targetId)
            : await this.queries.getAnswerById(targetId);

        if (!target) {
          throw new Error(
            `VOTING_SERVICE_NOT_FOUND_ERROR: ${targetType} not found`
          );
        }

        const currentVotes = target.votes || {
          upvotes: 0,
          downvotes: 0,
          score: 0,
        };

        let voteChanges = { upvotes: 0, downvotes: 0, score: 0 };
        let userVote = null;

        if (existingVote) {
          if (voteType === null || existingVote.voteType === voteType) {
            // Remove vote
            await this.queries.deleteVote(userId, targetId);
            if (existingVote.voteType === "up") {
              voteChanges.upvotes = -1;
            } else if (existingVote.voteType === "down") {
              voteChanges.downvotes = -1;
            }
            userVote = null;
          } else {
            // Change vote
            const voteData = {
              ...Vote,
              userId,
              targetId,
              targetType,
              voteType,
              createdAt: this.queries.getServerTimestamp(),
            };
            await this.queries.upsertVote(voteData);

            if (voteType === "up") {
              voteChanges.upvotes = 1;
              if (existingVote.voteType === "down") {
                voteChanges.downvotes = -1;
              }
            } else if (voteType === "down") {
              voteChanges.downvotes = 1;
              if (existingVote.voteType === "up") {
                voteChanges.upvotes = -1;
              }
            }
            userVote = voteType;
          }
        } else if (voteType) {
          // New vote (only if voteType is not null)
          const voteData = {
            ...Vote,
            userId,
            targetId,
            targetType,
            voteType,
            createdAt: this.queries.getServerTimestamp(),
          };
          await this.queries.upsertVote(voteData);

          if (voteType === "up") {
            voteChanges.upvotes = 1;
          } else if (voteType === "down") {
            voteChanges.downvotes = 1;
          }
          userVote = voteType;
        }

        voteChanges.score = voteChanges.upvotes - voteChanges.downvotes;

        // Update vote counts on target
        await this.queries.updateVoteCounts(targetId, targetType, voteChanges);

        const newVotes = {
          upvotes: Math.max(0, currentVotes.upvotes + voteChanges.upvotes),
          downvotes: Math.max(
            0,
            currentVotes.downvotes + voteChanges.downvotes
          ),
          score: currentVotes.score + voteChanges.score,
        };

        return {
          success: true,
          newVoteCount: newVotes.score,
          userVote: userVote,
          upvotes: newVotes.upvotes,
          downvotes: newVotes.downvotes,
        };
      });
    } catch (error) {
      if (error.message.startsWith("VOTING_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `VOTING_SERVICE_ERROR: Failed to vote - ${error.message}`
      );
    }
  }

  async getUserVote(userId, targetId) {
    try {
      if (!userId) {
        throw new Error("VOTING_SERVICE_VALIDATION_ERROR: User ID is required");
      }

      if (!targetId) {
        throw new Error(
          "VOTING_SERVICE_VALIDATION_ERROR: Target ID is required"
        );
      }

      const vote = await this.queries.getUserVote(userId, targetId);
      return vote ? vote.voteType : null;
    } catch (error) {
      if (error.message.startsWith("VOTING_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `VOTING_SERVICE_ERROR: Failed to get user vote - ${error.message}`
      );
    }
  }

  async getTopicVotes(topicId) {
    try {
      if (!topicId) {
        throw new Error(
          "VOTING_SERVICE_VALIDATION_ERROR: Topic ID is required"
        );
      }

      const votes = await this.queries.getVotesByTarget(topicId, "topic");

      const voteCounts = {
        upvotes: 0,
        downvotes: 0,
        score: 0,
      };

      votes.forEach((vote) => {
        if (vote.voteType === "up") {
          voteCounts.upvotes++;
        } else if (vote.voteType === "down") {
          voteCounts.downvotes++;
        }
      });

      voteCounts.score = voteCounts.upvotes - voteCounts.downvotes;

      return voteCounts;
    } catch (error) {
      if (error.message.startsWith("VOTING_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `VOTING_SERVICE_ERROR: Failed to get topic votes - ${error.message}`
      );
    }
  }

  async getAnswerVotes(answerId) {
    try {
      if (!answerId) {
        throw new Error(
          "VOTING_SERVICE_VALIDATION_ERROR: Answer ID is required"
        );
      }

      const votes = await this.queries.getVotesByTarget(answerId, "answer");

      const voteCounts = {
        upvotes: 0,
        downvotes: 0,
        score: 0,
      };

      votes.forEach((vote) => {
        if (vote.voteType === "up") {
          voteCounts.upvotes++;
        } else if (vote.voteType === "down") {
          voteCounts.downvotes++;
        }
      });

      voteCounts.score = voteCounts.upvotes - voteCounts.downvotes;

      return voteCounts;
    } catch (error) {
      if (error.message.startsWith("VOTING_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `VOTING_SERVICE_ERROR: Failed to get answer votes - ${error.message}`
      );
    }
  }
}

module.exports = new VotingService();
