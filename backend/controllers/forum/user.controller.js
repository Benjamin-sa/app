const userService = require("../../services/forum/user.service");
const cacheService = require("../../services/cache.service");

class UserController {
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
      console.error("USER_CONTROLLER_ERROR: Get User Profile Error:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `USER_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "user_controller",
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
        "USER_CONTROLLER_ERROR: Get User By Username Error:",
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
        error: `USER_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "user_controller",
      });
    }
  }
}

module.exports = new UserController();
