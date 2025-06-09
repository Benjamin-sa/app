const BaseController = require("../../../core/controller/base.controller");
const userService = require("../../auth/user.service");
const topicService = require("./topic.service");

class TopicController extends BaseController {
  constructor() {
    super("TOPIC");
  }

  // Common cache invalidation
  async invalidateTopicCaches(topicId = null, isUpdate = false) {
    const patterns = ["topics:*", "forum_stats"];
    if (topicId) patterns.push(`topic:${topicId}:*`);
    if (isUpdate) patterns.push("search:*");

    await Promise.all(patterns.map((pattern) => this.invalidateCache(pattern)));
  }

  // Common user activity update
  async updateUserActivity(userId) {
    try {
      await userService.updateUserActivity(userId);
      await this.deleteCache(`user_profile:${userId}`);
    } catch (activityError) {
      console.warn(
        `TOPIC_CONTROLLER_WARNING: Failed to update user activity - ${activityError.message}`
      );
    }
  }

  // Helper function to parse and handle images
  async parseAndHandleImages(
    images,
    imageData,
    existingImages = [],
    imagesToRemove = []
  ) {
    let finalImageData = [];

    // Handle existing images if provided
    if (existingImages) {
      const existingImagesArray =
        typeof existingImages === "string"
          ? JSON.parse(existingImages)
          : Array.isArray(existingImages)
          ? existingImages
          : [];

      // Add existing images to keep
      finalImageData.push(...existingImagesArray);
    }

    // Handle new images from request body
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

    // Handle processed image data from middleware
    if (imageData?.length > 0) {
      finalImageData.push(...imageData);
    }

    // Remove images that should be deleted
    if (imagesToRemove) {
      const removeIds =
        typeof imagesToRemove === "string"
          ? JSON.parse(imagesToRemove)
          : Array.isArray(imagesToRemove)
          ? imagesToRemove
          : [];

      if (removeIds.length > 0) {
        // Filter out images to remove and delete them
        const imagesToDelete = finalImageData.filter((img) =>
          removeIds.includes(img.id || img.fileId)
        );

        finalImageData = finalImageData.filter(
          (img) => !removeIds.includes(img.id || img.fileId)
        );

        // Delete removed images in background
        if (imagesToDelete.length > 0) {
          const imageService = require("../../../core/services/image.service");
          Promise.all(
            imagesToDelete.map((img) =>
              imageService
                .deleteImage(img)
                .catch((err) =>
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

  async topicOperation(req, res, mode = "create") {
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
      const topicId = isUpdate ? req.params.id : null;

      // Parse and handle images
      const imageData = await this.parseAndHandleImages(
        images,
        req.imageData,
        isUpdate ? existingImages : null,
        isUpdate ? imagesToRemove : null
      );

      // Construct topic data
      const topicData = {
        title,
        content,
        category,
        tags: tags ? (typeof tags === "string" ? JSON.parse(tags) : tags) : [],
        images: imageData,
        ...(isUpdate ? {} : { userId: req.user.uid }),
      };

      // Create or update topic
      const topic = isUpdate
        ? await topicService.updateTopic(topicId, topicData, req.user.uid)
        : await topicService.createTopic(topicData);

      // Invalidate caches and update user activity
      await this.invalidateTopicCaches(topicId, isUpdate);
      await this.updateUserActivity(req.user.uid);

      this.sendSuccess(res, topic, isUpdate ? 200 : 201);
    } catch (error) {
      this.handleError(res, error, `Topic ${mode}`);
    }
  }

  // Delete a topic
  async deleteTopic(req, res) {
    try {
      const { id: topicId } = req.params;

      await topicService.deleteTopic(topicId, req.user.uid);
      await this.invalidateTopicCaches(topicId, true);
      await this.updateUserActivity(req.user.uid);

      this.sendSuccess(res, {
        id: topicId,
        message: "Topic deleted successfully",
      });
    } catch (error) {
      this.handleError(res, error, "Delete Topic");
    }
  }

  // Unified function to get topics (all, by ID, or search)
  async getTopicsUnified(req, res, mode = "list") {
    try {
      const userId = req.user?.uid || null;
      let result, cacheKey;

      if (mode === "single") {
        const { id } = req.params;
        cacheKey = `topic:${id}:${userId || "anonymous"}`;

        result = await this.getCachedData(
          cacheKey,
          () => topicService.getTopicById(id, userId),
          180
        );
      } else if (mode === "search") {
        const { q: searchTerm, category, limit = 20 } = req.query;
        cacheKey = `search:${searchTerm}:${category || "all"}:${limit}`;

        result = await this.getCachedData(
          cacheKey,
          () =>
            topicService.searchTopics(searchTerm, {
              limit: parseInt(limit),
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
        } = req.query;
        const options = { limit: parseInt(limit), category, sortBy, sortOrder };
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

  // Get topics with pagination and filtering (wrapper for backward compatibility)
  async getTopics(req, res) {
    return this.getTopicsUnified(req, res, "list");
  }

  // Get single topic by ID (wrapper for backward compatibility)
  async getTopicById(req, res) {
    return this.getTopicsUnified(req, res, "single");
  }

  // Search topics (wrapper for backward compatibility)
  async searchTopics(req, res) {
    return this.getTopicsUnified(req, res, "search");
  }
}

module.exports = new TopicController();
