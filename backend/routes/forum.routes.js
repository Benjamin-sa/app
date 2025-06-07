const express = require("express");
const router = express.Router();
const userService = require("../services/forum/user.service");
const topicService = require("../services/forum/topic.service");
const answerService = require("../services/forum/answer.service");
const votingService = require("../services/forum/voting.service");
const authenticate = require("../middleware/auth");
const { uploadMultiple, handleUploadError } = require("../middleware/upload");
const imageService = require("../services/image.service");

// Cache control middleware
const setCacheHeaders =
  (maxAge = 300) =>
  (req, res, next) => {
    res.set("Cache-Control", `public, max-age=${maxAge}`);
    next();
  };

// ==================== USER ROUTES ====================

/**
 * GET /api/forum/users/profile/:uid
 * Get user profile by UID
 */
router.get("/users/profile/:uid", setCacheHeaders(300), async (req, res) => {
  try {
    const profile = await userService.getUserProfile(req.params.uid);
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
});

/**
 * GET /api/forum/users/username/:username
 * Get user profile by username
 */
router.get(
  "/users/username/:username",
  setCacheHeaders(300),
  async (req, res) => {
    try {
      const profile = await userService.getUserByUsername(req.params.username);
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
);

// ==================== IMAGE UPLOAD ROUTES ====================

/**
 * POST /api/forum/upload/images
 * Upload single or multiple images for forum posts
 */
router.post(
  "/upload/images",
  authenticate,
  uploadMultiple,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No image files provided",
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
);

// ==================== TOPIC ROUTES ====================

/**
 * POST /api/forum/topics
 * Create a new topic with pre-uploaded images
 */
router.post("/topics", authenticate, async (req, res) => {
  try {
    const { title, content, category, tags, images } = req.body;

    // Parse images if sent as string
    let imageUrls = [];
    if (images) {
      try {
        imageUrls = typeof images === "string" ? JSON.parse(images) : images;
      } catch (e) {
        imageUrls = [];
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
});

/**
 * GET /api/forum/topics
 * Get topics with pagination and filtering
 */
router.get("/topics", setCacheHeaders(120), async (req, res) => {
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

    const result = await topicService.getTopics(options);
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
});

/**
 * GET /api/forum/topics/:id
 * Get single topic by ID
 */
router.get("/topics/:id", setCacheHeaders(180), async (req, res) => {
  try {
    const userId = req.user?.uid || null; // Get user ID if authenticated
    const topic = await topicService.getTopicById(req.params.id, userId);
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
});

/**
 * GET /api/forum/search
 * Search topics
 */
router.get("/search", setCacheHeaders(300), async (req, res) => {
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

    const topics = await topicService.searchTopics(searchTerm.trim(), options);
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
});

// ==================== ANSWER ROUTES ====================

/**
 * POST /api/forum/topics/:topicId/answers
 * Create a new answer
 */
router.post(
  "/topics/:topicId/answers",
  authenticate,
  uploadMultiple,
  async (req, res) => {
    try {
      const { content, parentAnswerId } = req.body;
      const answerData = {
        topicId: req.params.topicId,
        content,
        authorId: req.user.uid,
        parentAnswerId: parentAnswerId || null,
      };

      const images = req.files || [];
      const answer = await answerService.createAnswer(answerData, images);

      // Update user activity
      await userService.updateUserActivity(req.user.uid);

      res.status(201).json({
        success: true,
        data: answer,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/forum/topics/:topicId/answers
 * Get answers for a topic
 */
router.get(
  "/topics/:topicId/answers",
  setCacheHeaders(180),
  async (req, res) => {
    try {
      const result = await answerService.getAnswersByTopic(req.params.topicId);
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
);

// ==================== VOTING ROUTES ====================

/**
 * POST /api/forum/vote
 * Vote on a topic or answer
 */
router.post("/vote", authenticate, async (req, res) => {
  try {
    const { targetId, targetType, voteType } = req.body;

    if (!targetId || !targetType) {
      return res.status(400).json({
        success: false,
        error: "targetId and targetType are required",
      });
    }

    // If voteType is null, remove the vote
    const result = await votingService.vote(
      req.user.uid,
      targetId,
      targetType,
      voteType
    );

    // Update user activity
    await userService.updateUserActivity(req.user.uid);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/forum/vote/:targetId
 * Get user's vote on a specific target
 */
router.get(
  "/vote/:targetId",
  authenticate,
  setCacheHeaders(600),
  async (req, res) => {
    try {
      const vote = await votingService.getUserVote(
        req.user.uid,
        req.params.targetId
      );
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
);

// ==================== STATISTICS ROUTES ====================

/**
 * GET /api/forum/stats
 * Get forum statistics
 */
router.get("/stats", setCacheHeaders(1800), async (req, res) => {
  try {
    const stats = await topicService.getForumStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== ERROR HANDLING ====================

// Handle multer upload errors
router.use(handleUploadError);

// Handle general errors
router.use((error, req, res, next) => {
  console.error("Forum API Error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

module.exports = router;
