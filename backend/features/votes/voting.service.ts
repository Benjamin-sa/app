import firebaseQueries = require("../../queries/FirebaseQueries");
import {
  createVote,
  ValidationError,
  validateId,
} from "../../utils/validation.utils";

export interface VoteCounts {
  upvotes: number;
  downvotes: number;
  score: number;
}
export interface VoteResult extends VoteCounts {
  success: boolean;
  userVote: string | null;
  newVoteCount: number;
}

class VotingService {
  private queries: any;
  constructor() {
    this.queries = firebaseQueries;
  }

  async vote(
    userId: string,
    targetId: string,
    targetType: string,
    voteType: string | null
  ): Promise<VoteResult> {
    try {
      const validatedVote: any = createVote({
        userId,
        targetId,
        targetType,
        voteType,
      });
      const target =
        targetType === "topic"
          ? await this.queries.getTopicById(targetId)
          : targetType === "answer"
          ? await this.queries.getAnswerById(targetId)
          : targetType === "bike"
          ? await this.queries.getBikeById(targetId)
          : await this.queries.getUserById(targetId);
      if (!target)
        throw new Error(
          `VOTING_SERVICE_NOT_FOUND_ERROR: ${targetType} not found`
        );
      await this.queries.createOrUpdateVote(
        validatedVote.userId,
        validatedVote.targetId,
        validatedVote.targetType,
        validatedVote.voteType
      );
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
        userVote,
        upvotes: currentVotes.upvotes,
        downvotes: currentVotes.downvotes,
        score: currentVotes.score,
      };
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`VOTING_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("VOTING_SERVICE_")) throw error;
      throw new Error(
        `VOTING_SERVICE_ERROR: Failed to vote - ${error.message}`
      );
    }
  }

  async getUserVote(userId: string, targetId: string): Promise<string | null> {
    try {
      const validatedUserId = validateId(userId);
      const validatedTargetId = validateId(targetId);
      const vote = await this.queries.getUserVote(
        validatedUserId,
        validatedTargetId
      );
      return vote ? vote.voteType : null;
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`VOTING_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("VOTING_SERVICE_")) throw error;
      throw new Error(
        `VOTING_SERVICE_ERROR: Failed to get user vote - ${error.message}`
      );
    }
  }

  async getVotes(targetId: string, targetType: string): Promise<VoteCounts> {
    try {
      const validatedTargetId = validateId(targetId);
      if (!["topic", "answer", "bike", "profile"].includes(targetType))
        throw new Error("VOTING_SERVICE_VALIDATION_ERROR: Invalid target type");
      const votes: any[] = await this.queries.getVotesByTarget(
        validatedTargetId,
        targetType
      );
      const voteCounts: VoteCounts = { upvotes: 0, downvotes: 0, score: 0 };
      votes.forEach((vote: any) => {
        if (vote.voteType === "up") voteCounts.upvotes++;
        else if (vote.voteType === "down") voteCounts.downvotes++;
      });
      voteCounts.score = voteCounts.upvotes - voteCounts.downvotes;
      return voteCounts;
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`VOTING_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith("VOTING_SERVICE_")) throw error;
      throw new Error(
        `VOTING_SERVICE_ERROR: Failed to get ${targetType} votes - ${error.message}`
      );
    }
  }
}

const votingService = new VotingService();
export default votingService;
module.exports = votingService;
