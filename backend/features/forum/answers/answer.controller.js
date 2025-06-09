const BaseController = require("../../../core/controller/base.controller");
const userService = require("../../auth/user.service");
const answerService = require("./answer.service");

class AnswerController extends BaseController {
  constructor() {
    super("ANSWER");
  }
  // Private helper method to handle answer creation and update
  async _handleAnswerOperation(req, isCreate = true) {
    const topicId = req.params.topicId || req.body.topicId;
    const answerId = isCreate ? null : req.params.answerId;
    const { content, parentAnswerId } = req.body;

    // Get processed image data from middleware
    const imageData = req.imageData || [];

    // Construct answer data
    const answerData = {
      content,
      userId: req.user.uid,
      topicId,
      parentAnswerId: parentAnswerId || null,
      images: imageData,
    };

    // Create or update the answer
    let answer;
    if (isCreate) {
      answer = await answerService.createAnswer(answerData);
    } else {
      // For update, we only need to pass the fields that can be updated
      const updateData = {
        content: answerData.content,
      };

      // Only include images if new ones were processed by middleware
      if (imageData.length > 0) {
        updateData.images = imageData;
      }

      answer = await answerService.updateAnswer(answerId, updateData);
    }

    // Invalidate caches
    await this._invalidateCaches(topicId, req.user.uid);

    return answer;
  }

  // Private helper method to handle cache invalidation
  async _invalidateCaches(topicId, userId) {
    // Invalidate topic cache since it now has a new/updated answer
    await this.invalidateCache(`topic:${topicId}:*`);
    await this.invalidateCache("topics:*");
    await this.invalidateCache("forum_stats");

    // Update user activity
    try {
      await userService.updateUserActivity(userId);
      // Invalidate user cache
      await this.deleteCache(`user_profile:${userId}`);
    } catch (activityError) {
      console.warn(
        `ANSWER_CONTROLLER_WARNING: Failed to update user activity - ${activityError.message}`
      );
    }
  }

  // Create a new answer
  async createAnswer(req, res) {
    try {
      const answer = await this._handleAnswerOperation(req, true);

      return this.sendSuccess(res, answer, 201);
    } catch (error) {
      this.handleError(res, error, "Create Answer");
    }
  }

  // Update an existing answer
  async updateAnswer(req, res) {
    try {
      const answer = await this._handleAnswerOperation(req, false);

      return this.sendSuccess(res, answer);
    } catch (error) {
      this.handleError(res, error, "Update Answer");
    }
  }

  // Get answers by topic ID
  async getAnswersByTopic(req, res) {
    try {
      const { topicId } = req.params;
      const { limit } = req.query;

      const options = {};
      if (limit) {
        options.limit = parseInt(limit);
      }

      const result = await answerService.getAnswersByTopic(topicId, options);

      return this.sendSuccess(res, result);
    } catch (error) {
      this.handleError(res, error, "Get Answers by Topic");
    }
  }

  // Delete an answer
  async deleteAnswer(req, res) {
    try {
      const { id: answerId } = req.params;
      const { topicId } = req.body;

      // Delete the answer
      const result = await answerService.deleteAnswer(answerId);

      // Invalidate caches
      await this._invalidateCaches(topicId, req.user.uid);

      return this.sendSuccess(res, result);
    } catch (error) {
      this.handleError(res, error, "Delete Answer");
    }
  }
}

module.exports = new AnswerController();
