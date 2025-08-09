import BaseController from "../../core/controller/base.controller";
import userService from "./user.service";
import { Request, Response } from "express";
import type { UploadedImageRecord } from "../../types/services/image.types";
import type { UpdateProfileInput } from "../../types/services/auth.types";

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

      const updateData: UpdateProfileInput = this._cleanUpdateData({
        username,
        displayName,
        bio,
        location,
        website,
        show_email: show_email === "true" || show_email === true,
        allow_messages: allow_messages === "true" || allow_messages === true,
      });

      // Normalize optional image input (uploaded via middleware)
      let newImage: UploadedImageRecord | null = null;
      const incoming = (req as any).imageData as
        | UploadedImageRecord
        | UploadedImageRecord[]
        | null;
      if (incoming) {
        newImage = Array.isArray(incoming) ? incoming[0] : incoming;
      }

      const result = await (userService as any).updateProfileWithAvatar(
        req.user.uid,
        updateData,
        newImage
      );
      await this.deleteCache(`user_profile:${req.user.uid}`);

      const responseData: any = { user: result.user };
      if (result.avatar) {
        responseData.avatar_url = result.avatar.url;
        if (result.avatar.thumbnailUrl)
          responseData.avatar_thumbnail = result.avatar.thumbnailUrl;
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
