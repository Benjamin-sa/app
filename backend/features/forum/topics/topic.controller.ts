import BaseController from "../../../core/controller/base.controller";
import userService from "../../auth/user.service"; // JS service
import topicService from "./topic.service";
import { Request, Response } from "express";

class TopicController extends BaseController {
  constructor() {
    super("TOPIC");
  }

  private async invalidateTopicCaches(
    topicId: string | null = null,
    isUpdate = false
  ) {
    const patterns = ["topics:*", "forum_stats"];
    if (topicId) patterns.push(`topic:${topicId}:*`);
    if (isUpdate) patterns.push("search:*");
    await Promise.all(patterns.map((p) => this.invalidateCache(p)));
  }

  private async updateUserActivity(userId: string) {
    try {
      await (userService as any).updateUserActivity(userId);
      await this.deleteCache(`user_profile:${userId}`);
    } catch (e: any) {
      console.warn(
        `TOPIC_CONTROLLER_WARNING: Failed to update user activity - ${e.message}`
      );
    }
  }

  private async parseAndHandleImages(
    images: any,
    imageData: any,
    existingImages: any = [],
    imagesToRemove: any = []
  ) {
    let finalImageData: any[] = [];
    if (existingImages) {
      const existingImagesArray =
        typeof existingImages === "string"
          ? JSON.parse(existingImages)
          : Array.isArray(existingImages)
          ? existingImages
          : [];
      finalImageData.push(...existingImagesArray);
    }
    if (images) {
      const newImagesArray =
        typeof images === "string"
          ? images.startsWith("[")
            ? JSON.parse(images)
            : [{ url: images }]
          : Array.isArray(images)
          ? images
          : [];
      finalImageData.push(...newImagesArray);
    }
    if (imageData?.length > 0) finalImageData.push(...imageData);
    if (imagesToRemove) {
      const removeIds =
        typeof imagesToRemove === "string"
          ? JSON.parse(imagesToRemove)
          : Array.isArray(imagesToRemove)
          ? imagesToRemove
          : [];
      if (removeIds.length) {
        const imagesToDelete = finalImageData.filter((img) =>
          removeIds.includes(img.id || img.fileId)
        );
        finalImageData = finalImageData.filter(
          (img) => !removeIds.includes(img.id || img.fileId)
        );
        if (imagesToDelete.length) {
          const imageService = require("../../../core/services/image.service");
          Promise.all(
            imagesToDelete.map((img: any) =>
              imageService
                .deleteImage(img)
                .catch((err: any) =>
                  console.warn(
                    `Failed to delete image ${img.url}:`,
                    err.message
                  )
                )
            )
          );
        }
      }
    }
    return finalImageData;
  }

  async topicOperation(
    req: Request,
    res: Response,
    mode: "create" | "update" = "create"
  ) {
    try {
      const {
        title,
        content,
        category,
        tags,
        images,
        existingImages,
        imagesToRemove,
      } = req.body;
      const isUpdate = mode === "update";
      const topicId = isUpdate ? (req.params as any).id : null;
      const imageData = await this.parseAndHandleImages(
        images,
        (req as any).imageData,
        isUpdate ? existingImages : null,
        isUpdate ? imagesToRemove : null
      );
      const topicData: any = {
        title,
        content,
        category,
        tags: tags ? (typeof tags === "string" ? JSON.parse(tags) : tags) : [],
        images: imageData,
        ...(isUpdate ? {} : { userId: (req as any).user.uid }),
      };
      const topic = isUpdate
        ? await topicService.updateTopic(
            topicId!,
            topicData,
            (req as any).user.uid
          )
        : await topicService.createTopic(topicData);
      await this.invalidateTopicCaches(topicId, isUpdate);
      await this.updateUserActivity((req as any).user.uid);
      this.sendSuccess(res, topic, isUpdate ? 200 : 201);
    } catch (error) {
      this.handleError(res, error, `Topic ${mode}`);
    }
  }

  async deleteTopic(req: Request, res: Response) {
    try {
      const { id: topicId } = req.params as any;
      await topicService.deleteTopic(topicId, (req as any).user.uid);
      await this.invalidateTopicCaches(topicId, true);
      await this.updateUserActivity((req as any).user.uid);
      this.sendSuccess(res, {
        id: topicId,
        message: "Topic deleted successfully",
      });
    } catch (error) {
      this.handleError(res, error, "Delete Topic");
    }
  }

  private async getTopicsUnified(
    req: Request,
    res: Response,
    mode: "list" | "single" | "search" = "list"
  ) {
    try {
      const userId = (req as any).user?.uid || null;
      let result: any, cacheKey: string;
      if (mode === "single") {
        const { id } = req.params as any;
        cacheKey = `topic:${id}:${userId || "anonymous"}`;
        result = await this.getCachedData(
          cacheKey,
          () => topicService.getTopicById(id, userId),
          180
        );
        if (result)
          topicService
            .trackTopicView(id, userId)
            .catch((err: any) =>
              console.warn(`Failed to track view for topic ${id}:`, err.message)
            );
      } else if (mode === "search") {
        const { q: searchTerm, category, limit = 20 } = req.query as any;
        cacheKey = `search:${searchTerm}:${category || "all"}:${limit}`;
        result = await this.getCachedData(
          cacheKey,
          () =>
            topicService.searchTopics(searchTerm, {
              limit: parseInt(limit, 10),
              category,
            }),
          60
        );
      } else {
        const {
          limit = 20,
          page = 1,
          category = null,
          sortBy = "createdAt",
          sortOrder = "desc",
        } = req.query as any;
        const options = {
          limit: parseInt(limit, 10),
          category,
          sortBy,
          sortOrder,
        };
        cacheKey = `topics:${JSON.stringify(options)}:${page}`;
        result = await this.getCachedData(
          cacheKey,
          () => topicService.getTopics(options),
          120
        );
      }
      this.sendSuccess(res, result);
    } catch (error) {
      this.handleError(res, error, `Get Topics ${mode}`);
    }
  }

  getTopics(req: Request, res: Response) {
    return this.getTopicsUnified(req, res, "list");
  }
  getTopicById(req: Request, res: Response) {
    return this.getTopicsUnified(req, res, "single");
  }
  searchTopics(req: Request, res: Response) {
    return this.getTopicsUnified(req, res, "search");
  }
}

const topicController = new TopicController();
export default topicController;
module.exports = topicController;
