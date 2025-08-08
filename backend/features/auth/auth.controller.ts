import BaseController from "../../core/controller/base.controller";
import userService from "./user.service";
import { Request, Response } from "express";

class AuthController extends BaseController {
  constructor() {
    super("AUTH");
  }

  private _cleanUpdateData(data: Record<string, any>) {
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined || data[key] === "") {
        delete data[key];
      }
    });
    return data;
  }

  async getMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, error: "Not authenticated" });
      }
      const userRecord = await this.getCachedData(
        `user_profile:${req.user.uid}`,
        () => (userService as any).getUserProfile(req.user!.uid, req.user!.uid)
      );
      return this.sendSuccess(res, userRecord);
    } catch (error) {
      this.handleError(res, error, "Get User");
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, error: "Not authenticated" });
      }
      const {
        username,
        displayName,
        bio,
        location,
        website,
        show_email,
        allow_messages,
      } = req.body;

      let updateData: Record<string, any> = this._cleanUpdateData({
        username,
        displayName,
        bio,
        location,
        website,
        show_email: show_email === "true" || show_email === true,
        allow_messages: allow_messages === "true" || allow_messages === true,
      });

      if ((req as any).imageData) {
        const currentUser = await userService.getUserProfile(req.user.uid);
        const oldAvatar = currentUser?.avatar
          ? {
              url: currentUser.avatar,
              thumbnailUrl: (currentUser as any).avatarThumbnail,
            }
          : null;

        const imageData = Array.isArray((req as any).imageData)
          ? (req as any).imageData[0]
          : (req as any).imageData;

        if (imageData && imageData.url) updateData.avatar = imageData.url;
        if (imageData && imageData.thumbnailUrl)
          updateData.avatarThumbnail = imageData.thumbnailUrl;
        if (imageData && imageData.mediumUrl)
          updateData.avatarMediumUrl = imageData.mediumUrl;

        (req as any).oldAvatar = oldAvatar;
        (req as any).newImageDetails = imageData
          ? {
              url: imageData.url,
              thumbnailUrl: imageData.thumbnailUrl,
              mediumUrl: imageData.mediumUrl,
            }
          : null;
      }

      const updatedUser = await userService.updateUserProfile(
        req.user.uid,
        updateData
      );
      await this.deleteCache(`user_profile:${req.user.uid}`);

      if ((req as any).oldAvatar?.url) {
        try {
          const imageService = require("../../core/services/image.service");
          await imageService.deleteImage((req as any).oldAvatar);
        } catch (deleteError: any) {
          console.warn("Failed to delete old avatar:", deleteError.message);
        }
      }

      const responseData: any = { user: updatedUser };
      if ((req as any).newImageDetails) {
        responseData.avatar_url = (req as any).newImageDetails.url;
        responseData.avatar_thumbnail = (
          req as any
        ).newImageDetails.thumbnailUrl;
      }

      return this.sendSuccess(
        res,
        responseData,
        200,
        "Profile updated successfully"
      );
    } catch (error) {
      this.handleError(res, error, "Profile Update");
    }
  }

  async syncUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, error: "Not authenticated" });
      }
      const syncData = {
        firebaseUid: req.user.uid,
        email: req.user.email,
        displayName: req.user.displayName,
        photoURL: (req.user as any).picture,
        emailVerified: req.user.emailVerified,
        providerData: (req.user as any).firebase?.firebase?.sign_in_provider
          ? [
              {
                providerId: (req.user as any).firebase.firebase
                  .sign_in_provider,
              },
            ]
          : null,
      };

      const result = await userService.syncUser(syncData as any);
      await this.deleteCache(`user_profile:${req.user.uid}`);

      const isNewUser = (result as any).createdAt && !(result as any).updatedAt;
      const status = isNewUser ? 201 : 200;
      const message = isNewUser
        ? "User created successfully"
        : "User synced successfully";

      return this.sendSuccess(res, result, status, message);
    } catch (error) {
      this.handleError(res, error, "User Sync");
    }
  }
}

export default new AuthController();
