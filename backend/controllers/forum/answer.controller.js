const userService = require("../../services/forum/user.service");
const answerService = require("../../services/forum/answer.service");
const imageService = require("../../services/image.service");
const cacheService = require("../../services/cache.service");

class AnswerController {
  // Create a new answer
  async createAnswer(req, res) {
    try {
      const { topicId } = req.params;
      const { content, parentAnswerId } = req.body;

      // Handle image uploads if any
      let imageData = [];
      if (req.files && req.files.length > 0) {
        try {
          const imageRecords = await imageService.uploadImages(
            req.files,
            "forum/answers"
          );
          imageData = imageRecords;
        } catch (uploadError) {
          return res.status(400).json({
            success: false,
            error: `ANSWER_CONTROLLER_ERROR: Image upload failed - ${uploadError.message}`,
            errorSource: "answer_controller",
          });
        }
      }

      // Construct answer data
      const answerData = {
        content,
        authorId: req.user.uid,
        topicId,
        parentAnswerId: parentAnswerId || null,
        images: imageData,
      };

      const answer = await answerService.createAnswer(answerData);

      // Invalidate topic cache since it now has a new answer
      await cacheService.invalidatePattern(`topic:${topicId}:*`);
      await cacheService.invalidatePattern("topics:*");
      await cacheService.invalidatePattern("forum_stats");

      // Update user activity
      try {
        await userService.updateUserActivity(req.user.uid);

        // Invalidate user cache
        await cacheService.del(`user_profile:${req.user.uid}`);
      } catch (activityError) {
        console.warn(
          `ANSWER_CONTROLLER_WARNING: Failed to update user activity - ${activityError.message}`
        );
      }

      res.status(201).json({
        success: true,
        data: answer,
      });
    } catch (error) {
      console.error("ANSWER_CONTROLLER_ERROR: Create Answer Error:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `ANSWER_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "answer_controller",
      });
    }
  }
}

module.exports = new AnswerController();
