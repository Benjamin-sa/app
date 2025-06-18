/**
 * Voting Service for Forum
 * Handles all voting-related operations
 */

const firebaseQueries = require("../../queries/FirebaseQueries");
const { COLLECTIONS } = require("../../models/forum.models");
const {
  createVote,
  ValidationError,
  validateId,
} = require("../../utils/validation.utils");

class VotingService {
  constructor() {
    this.queries = firebaseQueries;
  }

  async vote(userId, targetId, targetType, voteType) {
    try {
      // Create and validate vote using validation system
      const validatedVote = createVote({
        userId,
        targetId,
        targetType,
        voteType,
      });

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
        validatedVote.userId,
        validatedVote.targetId,
        validatedVote.targetType,
        validatedVote.voteType
      );

      // Get current vote counts
      const currentVotes = await this.getVotes(
        validatedVote.targetId,
        validatedVote.targetType
      );
      const userVote = await this.getUserVote(
        validatedVote.userId,
        validatedVote.targetId
      );

      return {
        success: true,
        newVoteCount: currentVotes.score,
        userVote: userVote,
        upvotes: currentVotes.upvotes,
        downvotes: currentVotes.downvotes,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`VOTING_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
      // Validate required parameters
      const validatedUserId = validateId(userId, "userId");
      const validatedTargetId = validateId(targetId, "targetId");

      const vote = await this.queries.getUserVote(
        validatedUserId,
        validatedTargetId
      );
      return vote ? vote.voteType : null;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`VOTING_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
      // Validate required parameters
      const validatedTargetId = validateId(targetId, "targetId");

      // Validate targetType using enum validation
      if (!["topic", "answer", "bike", "profile"].includes(targetType)) {
        throw new Error("VOTING_SERVICE_VALIDATION_ERROR: Invalid target type");
      }

      const votes = await this.queries.getVotesByTarget(
        validatedTargetId,
        targetType
      );

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
      if (error instanceof ValidationError) {
        throw new Error(`VOTING_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
