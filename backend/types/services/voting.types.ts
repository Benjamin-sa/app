// Service-level Voting types
import type { Vote } from "../entities/forum.types";

export interface VoteCounts {
  upvotes: number;
  downvotes: number;
  score: number;
}

export type VoteType = Vote["voteType"]; // "up" | "down"

export interface VoteResult extends VoteCounts {
  success: boolean;
  userVote: VoteType | null;
  newVoteCount: number;
}
