const BaseController = require("../base.controller");
const userService = require("../../services/forum/user.service");

class UserController extends BaseController {
  constructor() {
    super("USER");
  }

  // Get user profile by UID
  async getUserProfile(req, res) {
    try {
      const { uid } = req.params;
      const profile = await this.getCachedData(`user_profile:${uid}`, () =>
        userService.getUserProfile(uid)
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
      const profile = await this.getCachedData(
        `user_profile_by_username:${username}`,
        () => userService.getUserByUsername(username)
      );

      return this.sendSuccess(res, profile);
    } catch (error) {
      this.handleError(res, error, "Get User By Username");
    }
  }
}

module.exports = new UserController();
