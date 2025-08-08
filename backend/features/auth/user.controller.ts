import BaseController from "../../core/controller/base.controller";
import userService from "./user.service";
import { Request, Response } from "express";

class UserController extends BaseController {
  constructor() {
    super("USER");
  }

  async getUserProfile(req: Request, res: Response) {
    try {
      const { uid } = req.params as { uid: string };
      const profile = await this.getCachedData(
        `user_profile_public:${uid}`,
        () => userService.getUserProfile(uid)
      );
      return this.sendSuccess(res, profile);
    } catch (error) {
      this.handleError(res, error, "Get User Profile");
    }
  }

  async getUserByUsername(req: Request, res: Response) {
    try {
      const { username } = req.params as { username: string };
      const profile = await this.getCachedData(
        `user_profile_public_by_username:${username}`,
        async () => {
          const user = await userService.getUserByUsername(username);
          return userService.getUserProfile(user.uid);
        }
      );
      return this.sendSuccess(res, profile);
    } catch (error) {
      this.handleError(res, error, "Get User By Username");
    }
  }
}

export default new UserController();
