const BaseController = require("../../core/controller/base.controller");
const votingService = require("./voting.service");

class VotingController extends BaseController {
  constructor() {
    super("VOTING");
  }
  // Vote on a topic or answer
  async vote(req, res) {
    try {
      const { targetId, targetType, voteType } = req.body;
      const userId = req.user.uid;

      const result = await votingService.vote(
        userId,
        targetId,
        targetType,
        voteType
      );

      // Invalidate caches that include vote counts
      if (targetType === "topic") {
        await this.invalidateCache(`topic:${targetId}:*`);
        await this.invalidateCache("topics:*");
      }
      // Note: Bikes and profiles fetch vote data separately via voting API,
      // so no cache invalidation needed for those target types

      return this.sendSuccess(res, result);
    } catch (error) {
      this.handleError(res, error, "Vote");
    }
  }

  async getVote(req, res) {
    try {
      const { targetId, targetType } = req.params;
      const userId = req.user?.uid || null;

      const votes = await votingService.getVotes(targetId, targetType);
      let userVote = null;

      if (userId) {
        userVote = await votingService.getUserVote(userId, targetId);
      }

      return this.sendSuccess(res, {
        ...votes,
        userVote: userVote,
      });
    } catch (error) {
      this.handleError(res, error, "Get Vote Information");
    }
  }
}

module.exports = new VotingController();
