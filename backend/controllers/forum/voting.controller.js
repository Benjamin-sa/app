const votingService = require("../../services/forum/voting.service");
const cacheService = require("../../services/cache.service");

class VotingController {
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
        await cacheService.invalidatePattern(`topic:${targetId}:*`);
        await cacheService.invalidatePattern("topics:*");
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("VOTING_CONTROLLER_ERROR: Vote Error:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `VOTING_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "voting_controller",
      });
    }
  }

  // Get user's vote on a specific target
  async getUserVote(req, res) {
    try {
      const { targetId } = req.params;
      const userId = req.user.uid;

      const vote = await votingService.getUserVote(userId, targetId);

      res.json({
        success: true,
        data: vote,
      });
    } catch (error) {
      console.error("VOTING_CONTROLLER_ERROR: Get User Vote Error:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `VOTING_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "voting_controller",
      });
    }
  }
}

module.exports = new VotingController();
