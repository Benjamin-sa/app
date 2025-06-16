/**
 * Voting Service for Forum
 * Handles all voting-related operations
 */

const firebaseQueries = require("../../queries/FirebaseQueries");
const { COLLECTIONS } = require("../../models/forum.models");
const ValidationUtils = require("../../utils/validation.utils");

class VotingService {
  constructor() {
    this.queries = firebaseQueries;
  }

  async vote(userId, targetId, targetType, voteType) {
    try {
      // Validate required parameters
      ValidationUtils.required(
        { userId, targetId, targetType },
        "VOTING",
        "vote"
      );

      // Handle null voteType for vote removal
      if (
        ValidationUtils.exists(voteType) &&
        !["up", "down"].includes(voteType)
      ) {
        throw new Error(
          "VOTING_SERVICE_VALIDATION_ERROR: Invalid vote type. Must be 'up', 'down', or null"
        );
      }

      if (!["topic", "answer", "bike", "profile"].includes(targetType)) {
        throw new Error("VOTING_SERVICE_VALIDATION_ERROR: Invalid target type");
      }

      // Verify target exists
      const target =
        targetType === "topic"
          ? await this.queries.getTopicById(targetId)
          : targetType === "answer"
          ? await this.queries.getAnswerById(targetId)
          : targetType === "bike"
          ? await this.queries.getBikeById(targetId)
          : await this.queries.getUserById(targetId);

      if (!target) {
        throw new Error(
          `VOTING_SERVICE_NOT_FOUND_ERROR: ${targetType} not found`
        );
      }

      // Create or update vote using queries
      await this.queries.createOrUpdateVote(
        userId,
        targetId,
        targetType,
        voteType
      );

      // Get current vote counts
      const currentVotes = await this.getVotes(targetId, targetType);
      const userVote = await this.getUserVote(userId, targetId);

      return {
        success: true,
        newVoteCount: currentVotes.score,
        userVote: userVote,
        upvotes: currentVotes.upvotes,
        downvotes: currentVotes.downvotes,
      };
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
      ValidationUtils.required({ userId, targetId }, "VOTING", "get user vote");

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

  async getVotes(targetId, targetType) {
    try {
      ValidationUtils.required({ targetId }, "VOTING", "get votes");

      if (!["topic", "answer", "bike", "profile"].includes(targetType)) {
        throw new Error("VOTING_SERVICE_VALIDATION_ERROR: Invalid target type");
      }

      const votes = await this.queries.getVotesByTarget(targetId, targetType);

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
        `VOTING_SERVICE_ERROR: Failed to get ${targetType} votes - ${error.message}`
      );
    }
  }
}

module.exports = new VotingService();
