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
      const cacheKey = `user_profile:${uid}`;

      // Try to get from cache first
      let profile = await cacheService.get(cacheKey);

      if (!profile) {
        // Cache miss - fetch from database
        profile = await userService.getUserProfile(uid);

        // Cache for 5 minutes
        await cacheService.set(cacheKey, profile, 300);
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error("FORUM_CONTROLLER_ERROR: Get User Profile Error:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `FORUM_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "forum_controller",
      });
    }
  }

  // Get user profile by username
  async getUserByUsername(req, res) {
    try {
      const { username } = req.params;
      const cacheKey = `user_profile_by_username:${username}`;

      // Try to get from cache first
      let profile = await cacheService.get(cacheKey);

      if (!profile) {
        // Cache miss - fetch from database
        profile = await userService.getUserByUsername(username);

        // Cache for 5 minutes
        await cacheService.set(cacheKey, profile, 300);
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error(
        "FORUM_CONTROLLER_ERROR: Get User By Username Error:",
        error
      );

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `FORUM_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "forum_controller",
      });
    }
  }

  // ==================== TOPIC METHODS ====================

  // Create a new topic with pre-uploaded images
  async createTopic(req, res) {
    try {
      const { title, content, category, tags, images } = req.body;

      // Parse images if sent as string
      let imageData = [];
      if (images) {
        try {
          if (typeof images === "string") {
            try {
              imageData = JSON.parse(images);
            } catch (e) {
              imageData = [{ url: images }];
            }
          } else if (Array.isArray(images)) {
            imageData = images;
          }
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            error: `FORUM_CONTROLLER_ERROR: Failed to parse images data - ${parseError.message}`,
            errorSource: "forum_controller",
          });
        }
      }

      // Handle file uploads if any
      if (req.files && req.files.length > 0) {
        try {
          const imageRecords = await imageService.uploadImages(
            req.files,
            "forum/topics"
          );
          imageData = [...imageData, ...imageRecords];
        } catch (uploadError) {
          return res.status(400).json({
            success: false,
            error: `FORUM_CONTROLLER_ERROR: Image upload failed - ${uploadError.message}`,
            errorSource: "forum_controller",
          });
        }
      }

      // Construct topic data
      const topicData = {
        title,
        content,
        authorId: req.user.uid,
        category,
        tags: tags ? (typeof tags === "string" ? JSON.parse(tags) : tags) : [],
        images: imageData,
      };

      // Create topic through service
      const topic = await topicService.createTopic(topicData);

      // Invalidate topic list caches
      await cacheService.invalidatePattern("topics:*");
      await cacheService.invalidatePattern("forum_stats");

      // Update user activity
      try {
        await userService.updateUserActivity(req.user.uid);

        // Invalidate user cache
        await cacheService.del(`user_profile:${req.user.uid}`);
      } catch (activityError) {
        console.warn(
          `FORUM_CONTROLLER_WARNING: Failed to update user activity - ${activityError.message}`
        );
      }

      res.status(201).json({
        success: true,
        data: topic,
      });
    } catch (error) {
      console.error("FORUM_CONTROLLER_ERROR: Topic creation failed:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `FORUM_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "forum_controller",
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
      const cacheKey = `topics:${JSON.stringify(options)}:${page}`;

      // Try to get from cache first
      let result = await cacheService.get(cacheKey);

      if (!result) {
        // Cache miss - fetch from database
        result = await topicService.getTopics(options);

        // Enrich each topic with author profile and vote counts
        const enrichedTopics = await Promise.all(
          result.topics.map(async (topic) => {
            try {
              // Get topic author profile with caching
              const authorCacheKey = `user_profile:${topic.authorId}`;
              let authorProfile = await cacheService.get(authorCacheKey);

              if (!authorProfile) {
                authorProfile = await userService.getUserProfile(
                  topic.authorId
                );
                await cacheService.set(authorCacheKey, authorProfile, 300);
              }

              topic.author = authorProfile;

              // Get topic votes
              const topicVotes = await votingService.getTopicVotes(topic.id);
              topic.votes = topicVotes;

              // Get user's vote on this topic if user is authenticated
              if (req.user?.uid) {
                topic.userVote = await votingService.getUserVote(
                  req.user.uid,
                  topic.id
                );
              }

              return topic;
            } catch (enrichError) {
              console.warn(
                `FORUM_CONTROLLER_WARNING: Failed to enrich topic ${topic.id} - ${enrichError.message}`
              );
              // Return topic without enrichment rather than failing
              return topic;
            }
          })
        );

        result.topics = enrichedTopics;

        // Cache for 2 minutes (shorter TTL for dynamic content)
        await cacheService.set(cacheKey, result, 120);
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("FORUM_CONTROLLER_ERROR: Get Topics Error:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        error: `FORUM_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "forum_controller",
      });
    }
  }

  // Get single topic by ID
  async getTopicById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.uid || null;
      const cacheKey = `topic:${id}:${userId || "anonymous"}`;

      // Try to get from cache first
      let topic = await cacheService.get(cacheKey);

      if (!topic) {
        // Cache miss - fetch from database
        topic = await topicService.getTopicById(id, userId);

        // Enrich topic with author profile
        try {
          const authorCacheKey = `user_profile:${topic.authorId}`;
          let authorProfile = await cacheService.get(authorCacheKey);

          if (!authorProfile) {
            authorProfile = await userService.getUserProfile(topic.authorId);
            await cacheService.set(authorCacheKey, authorProfile, 300);
          }

          topic.author = authorProfile;
        } catch (authorError) {
          console.warn(
            `FORUM_CONTROLLER_WARNING: Failed to get author profile - ${authorError.message}`
          );
        }

        // Get topic votes
        try {
          const topicVotes = await votingService.getTopicVotes(id);
          topic.votes = topicVotes;
        } catch (voteError) {
          console.warn(
            `FORUM_CONTROLLER_WARNING: Failed to get topic votes - ${voteError.message}`
          );
          topic.votes = { upvotes: 0, downvotes: 0, score: 0 };
        }

        // Get user's vote on this topic if user is authenticated
        if (userId) {
          try {
            topic.userVote = await votingService.getUserVote(userId, id);
          } catch (userVoteError) {
            console.warn(
              `FORUM_CONTROLLER_WARNING: Failed to get user vote - ${userVoteError.message}`
            );
          }
        }

        // Get answers for this topic
        try {
          const answersResult = await answerService.getAnswersByTopic(id);
          const answers = answersResult.answers || [];

          // Enrich each answer with author profile and votes
          const enrichedAnswers = await Promise.all(
            answers.map(async (answer) => {
              try {
                // Get answer author profile
                const answerAuthor = await userService.getUserProfile(
                  answer.authorId
                );
                answer.author = answerAuthor;

                // Get answer votes
                const answerVotes = await votingService.getAnswerVotes(
                  answer.id
                );
                answer.votes = answerVotes;

                // Get user's vote on this answer if user is authenticated
                if (userId) {
                  answer.userVote = await votingService.getUserVote(
                    userId,
                    answer.id
                  );
                }

                return answer;
              } catch (answerEnrichError) {
                console.warn(
                  `FORUM_CONTROLLER_WARNING: Failed to enrich answer ${answer.id} - ${answerEnrichError.message}`
                );
                return answer;
              }
            })
          );

          // Add enriched answers to topic
          topic.answers = enrichedAnswers;
          topic.answerCount = enrichedAnswers.length;
        } catch (answersError) {
          console.warn(
            `FORUM_CONTROLLER_WARNING: Failed to get answers - ${answersError.message}`
          );
          topic.answers = [];
          topic.answerCount = 0;
        }

        // Cache for 3 minutes
        await cacheService.set(cacheKey, topic, 180);
      }

      res.json({
        success: true,
        data: topic,
      });
    } catch (error) {
      console.error("FORUM_CONTROLLER_ERROR: Get Topic By ID Error:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `FORUM_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "forum_controller",
      });
    }
  }

  // Search topics
  async searchTopics(req, res) {
    try {
      const { q: searchTerm, category, limit = 20 } = req.query;
      const cacheKey = `search:${searchTerm}:${category || "all"}:${limit}`;

      // Try to get from cache first
      let topics = await cacheService.get(cacheKey);

      if (!topics) {
        // Cache miss - perform search
        const options = {
          limit: parseInt(limit),
          category,
        };

        topics = await topicService.searchTopics(searchTerm, options);

        // Cache search results for 1 minute
        await cacheService.set(cacheKey, topics, 60);
      }

      res.json({
        success: true,
        data: topics,
      });
    } catch (error) {
      console.error("FORUM_CONTROLLER_ERROR: Search Topics Error:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        error: `FORUM_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "forum_controller",
      });
    }
  }

  // ==================== ANSWER METHODS ====================

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
            error: `FORUM_CONTROLLER_ERROR: Image upload failed - ${uploadError.message}`,
            errorSource: "forum_controller",
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
          `FORUM_CONTROLLER_WARNING: Failed to update user activity - ${activityError.message}`
        );
      }

      res.status(201).json({
        success: true,
        data: answer,
      });
    } catch (error) {
      console.error("FORUM_CONTROLLER_ERROR: Create Answer Error:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `FORUM_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "forum_controller",
      });
    }
  }

  // ==================== VOTING METHODS ====================

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
      console.error("FORUM_CONTROLLER_ERROR: Vote Error:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `FORUM_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "forum_controller",
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
      console.error("FORUM_CONTROLLER_ERROR: Get User Vote Error:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `FORUM_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "forum_controller",
      });
    }
  }

  // ==================== STATISTICS METHODS ====================

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
            `FORUM_CONTROLLER_WARNING: Failed to get user stats - ${userStatsError.message}`
          );
        }

        try {
          answerStats = await answerService.getAnswerStats();
        } catch (answerStatsError) {
          console.warn(
            `FORUM_CONTROLLER_WARNING: Failed to get answer stats - ${answerStatsError.message}`
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
      console.error("FORUM_CONTROLLER_ERROR: Get Forum Stats Error:", error);

      res.status(500).json({
        success: false,
        error: `FORUM_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "forum_controller",
      });
    }
  }
}

module.exports = new ForumController();
