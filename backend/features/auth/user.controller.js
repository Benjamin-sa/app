const BaseController = require("../../core/controller/base.controller");
const userService = require("./user.service");

class UserController extends BaseController {
  constructor() {
    super("USER");
  }

  // Get user profile by UID
  async getUserProfile(req, res) {
    try {
      const { uid } = req.params;
      // Don't pass viewerUid for public profile viewing - will return sanitized data
      const profile = await this.getCachedData(
        `user_profile_public:${uid}`,
        () => userService.getUserProfile(uid)
      );

      return this.sendSuccess(res, profile);
    } catch (error) {
      this.handleError(res, error, "Get User Profile");
    }
  }

  // Get user profile by username
  async getUserByUsername(req, res) {
    try {
      const { username } = req.params;
      // First get the user to get their UID, then get sanitized profile
      const profile = await this.getCachedData(
        `user_profile_public_by_username:${username}`,
        async () => {
          const user = await userService.getUserByUsername(username);
          return userService.getUserProfile(user.uid); // This will return sanitized data
        }
      );

      return this.sendSuccess(res, profile);
    } catch (error) {
      this.handleError(res, error, "Get User By Username");
    }
  }
}

module.exports = new UserController();
