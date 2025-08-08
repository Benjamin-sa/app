import BaseController from "../../../core/controller/base.controller";
import answerService from "./answer.service";
import userService from "../../auth/user.service";
import { Request, Response } from "express";

class AnswerController extends BaseController {
  constructor() {
    super("ANSWER");
  }

  private async handleAnswerOperation(req: Request, isCreate = true) {
    const topicId = (req.params as any).topicId || (req.body as any).topicId;
    const answerId = isCreate ? null : (req.params as any).answerId;
    const { content, parentAnswerId } = req.body as any;
    const imageData = (req as any).imageData || [];
    const answerData = {
      content,
      userId: (req as any).user.uid,
      topicId,
      parentAnswerId: parentAnswerId || null,
      images: imageData,
    };

    const answer = isCreate
      ? await answerService.createAnswer(answerData as any)
      : await answerService.updateAnswer(answerId!, {
          content,
          ...(imageData.length ? { images: imageData } : {}),
        });

    await this.invalidateCaches(topicId, (req as any).user.uid);
    return answer;
  }

  private async invalidateCaches(topicId: string, userId: string) {
    await this.invalidateCache(`topic:${topicId}:*`);
    await this.invalidateCache("topics:*");
    await this.invalidateCache("forum_stats");
    try {
      await (userService as any).updateUserActivity(userId);
      await this.deleteCache(`user_profile:${userId}`);
    } catch (e: any) {
      console.warn(
        `ANSWER_CONTROLLER_WARNING: Failed to update user activity - ${e.message}`
      );
    }
  }

  async createAnswer(req: Request, res: Response) {
    try {
      const answer = await this.handleAnswerOperation(req, true);
      return this.sendSuccess(res, answer, 201);
    } catch (e) {
      this.handleError(res, e, "Create Answer");
    }
  }

  async updateAnswer(req: Request, res: Response) {
    try {
      const answer = await this.handleAnswerOperation(req, false);
      return this.sendSuccess(res, answer);
    } catch (e) {
      this.handleError(res, e, "Update Answer");
    }
  }

  async getAnswersByTopic(req: Request, res: Response) {
    try {
      const { topicId } = req.params as any;
      const { limit } = req.query as any;
      const options: any = {};
      if (limit) options.limit = parseInt(limit, 10);
      const result = await answerService.getAnswersByTopic(topicId, options);
      return this.sendSuccess(res, result);
    } catch (e) {
      this.handleError(res, e, "Get Answers by Topic");
    }
  }

  async deleteAnswer(req: Request, res: Response) {
    try {
      const { id: answerId } = req.params as any;
      const { topicId } = req.body as any;
      const result = await answerService.deleteAnswer(answerId);
      await this.invalidateCaches(topicId, (req as any).user.uid);
      return this.sendSuccess(res, result);
    } catch (e) {
      this.handleError(res, e, "Delete Answer");
    }
  }
}

const answerController = new AnswerController();
export default answerController;
module.exports = answerController;
