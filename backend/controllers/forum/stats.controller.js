const BaseController = require("../base.controller");
const userService = require("../../services/forum/user.service");
const topicService = require("../../services/forum/topic.service");
const answerService = require("../../services/forum/answer.service");

class StatsController extends BaseController {
  constructor() {
    super("STATS");
  }
  // Get forum statistics
  async getForumStats(req, res) {
    try {
      const stats = await this.getCachedData(
        "forum_stats",
        async () => {
          const topicStats = await topicService.getTopicStats();

          // Handle missing methods gracefully
          let userStats = {};
          let answerStats = {};

          try {
            userStats = await userService.getUserStats();
          } catch (userStatsError) {
            console.warn(
              `STATS_CONTROLLER_WARNING: Failed to get user stats - ${userStatsError.message}`
            );
          }

          try {
            answerStats = await answerService.getAnswerStats();
          } catch (answerStatsError) {
            console.warn(
              `STATS_CONTROLLER_WARNING: Failed to get answer stats - ${answerStatsError.message}`
            );
          }

          return {
            topics: topicStats,
            users: userStats,
            answers: answerStats,
            lastUpdated: new Date(),
          };
        },
        600 // Cache for 10 minutes
      );

      return this.sendSuccess(res, stats);
    } catch (error) {
      this.handleError(res, error, "Get Forum Stats");
    }
  }
}

module.exports = new StatsController();
