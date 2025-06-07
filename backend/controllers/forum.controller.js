const userService = require("../services/forum/user.service");
const topicService = require("../services/forum/topic.service");
const answerService = require("../services/forum/answer.service");
const votingService = require("../services/forum/voting.service");
const imageService = require("../services/image.service");
const cacheService = require("../services/cache.service");

class ForumController {
  // ==================== USER METHODS ====================

  // Get user profile by UID
  async getUserProfile(req, res) {
    try {
      const { uid } = req.params;
      const cacheKey = `user:profile:${uid}`;

      // Try to get from cache first
      let profile = await cacheService.get(cacheKey);

      if (!profile) {
        profile = await userService.getUserProfile(uid);

        if (profile) {
          // Cache for 5 minutes
          await cacheService.set(cacheKey, profile, 300);
        }
      }

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get user profile by username
  async getUserByUsername(req, res) {
    try {
      const { username } = req.params;
      const cacheKey = `user:username:${username}`;

      // Try to get from cache first
      let profile = await cacheService.get(cacheKey);

      if (!profile) {
        profile = await userService.getUserByUsername(username);

        if (profile) {
          // Cache for 5 minutes
          await cacheService.set(cacheKey, profile, 300);
        }
      }

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // ==================== IMAGE METHODS ====================

  // Upload single or multiple images for forum posts
  async uploadImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No files uploaded",
        });
      }

      if (req.files.length > 5) {
        return res.status(400).json({
          success: false,
          error: "Maximum 5 images allowed",
        });
      }

      console.log("Received files:", req.files.length, "files");

      const imageRecords = await imageService.uploadImages(
        req.files,
        "forum/images"
      );

      const responseData = imageRecords.map((record) => ({
        id: record.id,
        url: record.url,
        thumbnailUrl: record.thumbnailUrl,
        mediumUrl: record.mediumUrl,
      }));

      // Always return single object for single file, array for multiple
      res.json({
        success: true,
        data: req.files.length === 1 ? responseData[0] : responseData,
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // ==================== TOPIC METHODS ====================

  // Create a new topic with pre-uploaded images
  async createTopic(req, res) {
    try {
      const { title, content, category, tags, images } = req.body;

      // Parse images if sent as string
      let imageUrls = [];
      if (images) {
        if (typeof images === "string") {
          try {
            imageUrls = JSON.parse(images);
          } catch (e) {
            imageUrls = [images];
          }
        } else if (Array.isArray(images)) {
          imageUrls = images;
        }
      }

      const topicData = {
        title,
        content,
        authorId: req.user.uid,
        category,
        tags: tags ? (typeof tags === "string" ? JSON.parse(tags) : tags) : [],
        images: imageUrls,
      };

      // No uploaded files - images are pre-uploaded URLs
      const topic = await topicService.createTopic(topicData, []);

      // Update user activity
      await userService.updateUserActivity(req.user.uid);

      // Invalidate relevant caches
      await cacheService.invalidatePattern("topics:*");
      await cacheService.invalidatePattern("forum:stats");
      await cacheService.invalidatePattern(`user:*:${req.user.uid}`);

      res.status(201).json({
        success: true,
        data: topic,
      });
    } catch (error) {
      console.error("Create topic error:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get topics with pagination and filtering
  async getTopics(req, res) {
    try {
      const {
        limit = 20,
        page = 1,
        category = null,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const options = {
        limit: parseInt(limit),
        category,
        sortBy,
        sortOrder,
      };

      // Create cache key based on query parameters
      const cacheKey = `topics:list:${JSON.stringify(options)}`;

      // Try to get from cache first
      let result = await cacheService.get(cacheKey);

      if (!result) {
        result = await topicService.getTopics(options);

        if (result) {
          // Cache for 2 minutes
          await cacheService.set(cacheKey, result, 120);
        }
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get single topic by ID
  async getTopicById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.uid || null;
      const cacheKey = `topic:${id}:user:${userId || "anonymous"}`;

      // Try to get from cache first
      let topic = await cacheService.get(cacheKey);

      if (!topic) {
        topic = await topicService.getTopicById(id, userId);

        if (topic) {
          // Cache for 3 minutes
          await cacheService.set(cacheKey, topic, 180);
        }
      }

      if (!topic) {
        return res.status(404).json({
          success: false,
          error: "Topic not found",
        });
      }

      res.json({
        success: true,
        data: topic,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Search topics
  async searchTopics(req, res) {
    try {
      const { q: searchTerm, category, limit = 20 } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Search term must be at least 2 characters",
        });
      }

      const options = {
        limit: parseInt(limit),
        category,
      };

      // Create cache key for search
      const cacheKey = `search:${searchTerm.trim()}:${JSON.stringify(options)}`;

      // Try to get from cache first
      let topics = await cacheService.get(cacheKey);

      if (!topics) {
        topics = await topicService.searchTopics(searchTerm.trim(), options);

        if (topics) {
          // Cache search results for 5 minutes
          await cacheService.set(cacheKey, topics, 300);
        }
      }

      res.json({
        success: true,
        data: topics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // ==================== ANSWER METHODS ====================

  // Create a new answer
  async createAnswer(req, res) {
    try {
      const { topicId } = req.params;
      const { content, parentAnswerId } = req.body;

      // Process uploaded images if any
      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        const imageRecords = await imageService.uploadImages(
          req.files,
          "forum/answers"
        );
        imageUrls = imageRecords.map((record) => record.url);
      }

      const answerData = {
        content,
        authorId: req.user.uid,
        topicId,
        parentAnswerId: parentAnswerId || null,
        images: imageUrls,
      };

      const answer = await answerService.createAnswer(answerData);

      // Update user activity
      await userService.updateUserActivity(req.user.uid);

      // Invalidate relevant caches
      await cacheService.invalidatePattern(`topic:${topicId}:*`);
      await cacheService.invalidatePattern(`answers:${topicId}:*`);
      await cacheService.invalidatePattern("forum:stats");

      res.status(201).json({
        success: true,
        data: answer,
      });
    } catch (error) {
      console.error("Create answer error:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get answers for a topic
  async getTopicAnswers(req, res) {
    try {
      const { topicId } = req.params;
      const {
        limit = 20,
        page = 1,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const options = {
        limit: parseInt(limit),
        page: parseInt(page),
        sortBy,
        sortOrder,
      };

      const cacheKey = `answers:${topicId}:${JSON.stringify(options)}`;

      // Try to get from cache first
      let answers = await cacheService.get(cacheKey);

      if (!answers) {
        answers = await answerService.getAnswersByTopic(topicId, options);

        if (answers) {
          // Cache for 3 minutes
          await cacheService.set(cacheKey, answers, 180);
        }
      }

      res.json({
        success: true,
        data: answers,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // ==================== VOTING METHODS ====================

  // Vote on a topic or answer
  async vote(req, res) {
    try {
      const { targetId, targetType, voteType } = req.body;
      const userId = req.user.uid;

      // Validate required parameters
      if (!targetId || typeof targetId !== "string" || targetId.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "Invalid target ID",
        });
      }

      if (!userId || typeof userId !== "string" || userId.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "User not authenticated",
        });
      }

      if (!["topic", "answer"].includes(targetType)) {
        return res.status(400).json({
          success: false,
          error: "Invalid target type",
        });
      }

      // Allow null for vote removal, or "up"/"down" for voting
      if (voteType !== null && !["up", "down"].includes(voteType)) {
        return res.status(400).json({
          success: false,
          error: "Invalid vote type. Must be 'up', 'down', or null",
        });
      }

      const result = await votingService.vote(
        userId,
        targetId.trim(),
        targetType,
        voteType
      );

      // Invalidate relevant caches
      await cacheService.invalidatePattern(`vote:${targetId}:*`);
      await cacheService.invalidatePattern(`topic:${targetId}:*`);
      await cacheService.invalidatePattern(`user:*:${userId}`);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Vote error:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get user's vote on a specific target
  async getUserVote(req, res) {
    try {
      const { targetId } = req.params;
      const userId = req.user.uid;
      const cacheKey = `vote:${targetId}:user:${userId}`;

      // Try to get from cache first
      let vote = await cacheService.get(cacheKey);

      if (vote === null) {
        vote = await votingService.getUserVote(userId, targetId);

        // Cache for 10 minutes
        await cacheService.set(cacheKey, vote || {}, 600);
      }

      res.json({
        success: true,
        data: vote,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // ==================== STATISTICS METHODS ====================

  // Get forum statistics
  async getForumStats(req, res) {
    try {
      const cacheKey = "forum:stats";

      // Try to get from cache first
      let stats = await cacheService.get(cacheKey);

      if (!stats) {
        // Gather statistics from various services
        const topicStats = await topicService.getTopicStats();
        const userStats = await userService.getUserStats();
        const answerStats = await answerService.getAnswerStats();

        stats = {
          topics: topicStats,
          users: userStats,
          answers: answerStats,
          lastUpdated: new Date(),
        };

        // Cache for 30 minutes
        await cacheService.set(cacheKey, stats, 1800);
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Forum stats error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new ForumController();
