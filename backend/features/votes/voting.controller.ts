import BaseController from "../../core/controller/base.controller";
import votingService from "./voting.service";
import { Request, Response } from "express";

class VotingController extends BaseController {
  constructor() {
    super("VOTING");
  }

  vote = this.wrap(
    async (req: Request, _res: Response) => {
      const { targetId, targetType, voteType } = req.body;
      const userId = (req as any).user.uid;
      return votingService.vote(userId, targetId, targetType, voteType);
    },
    { op: "Vote" }
  );

  getVote = this.wrap(
    async (req: Request) => {
      const { targetId, targetType } = req.params as any;
      const userId = (req as any).user?.uid || null;
      const votes = await votingService.getVotes(targetId, targetType);
      let userVote: string | null = null;
      if (userId) userVote = await votingService.getUserVote(userId, targetId);
      return { ...votes, userVote };
    },
    { op: "Get Vote Information" }
  );
}

const votingController = new VotingController();
(votingController as any).vote = votingController.vote.bind(votingController);
(votingController as any).getVote =
  votingController.getVote.bind(votingController);
export default votingController;
module.exports = votingController;
