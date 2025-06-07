const userService = require("../../services/forum/user.service");
const topicService = require("../../services/forum/topic.service");
const answerService = require("../../services/forum/answer.service");
const cacheService = require("../../services/cache.service");

class StatsController {
  // Get forum statistics
  async getForumStats(req, res) {
    try {
      const cacheKey = "forum_stats";

      // Try to get from cache first
      let stats = await cacheService.get(cacheKey);

      if (!stats) {
        // Cache miss - calculate stats
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

        stats = {
          topics: topicStats,
          users: userStats,
          answers: answerStats,
          lastUpdated: new Date(),
        };

        // Cache stats for 10 minutes
        await cacheService.set(cacheKey, stats, 600);
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("STATS_CONTROLLER_ERROR: Get Forum Stats Error:", error);

      res.status(500).json({
        success: false,
        error: `STATS_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "stats_controller",
      });
    }
  }
}

module.exports = new StatsController();
