const BaseController = require("../../core/controller/base.controller");
const userService = require("./user.service");

class AuthController extends BaseController {
  constructor() {
    super("AUTH");
  }

  // Helper method to clean update data
  _cleanUpdateData(data) {
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined || data[key] === "") {
        delete data[key];
      }
    });
    return data;
  }

  // Get current user info (protected route)
  async getMe(req, res) {
    try {
      const userRecord = await this.getCachedData(
        `user_profile:${req.user.uid}`,
        () => userService.getUserProfile(req.user.uid, req.user.uid) // Pass viewerUid as same as uid for own profile
      );
      return this.sendSuccess(res, userRecord);
    } catch (error) {
      this.handleError(res, error, "Get User");
    }
  }

  async updateProfile(req, res) {
    try {
      const {
        username,
        displayName,
        bio,
        location,
        website,
        show_email,
        allow_messages,
      } = req.body;

      let updateData = this._cleanUpdateData({
        username,
        displayName,
        bio,
        location,
        website,
        show_email: show_email === "true" || show_email === true,
        allow_messages: allow_messages === "true" || allow_messages === true,
      });

      if (req.imageData) {
        // Get current user to handle old avatar cleanup
        const currentUser = await userService.getUserProfile(req.user.uid);
        const oldAvatar = currentUser?.avatar
          ? {
              url: currentUser.avatar,
              thumbnailUrl: currentUser.avatarThumbnail,
            }
          : null;

        // Get the first image from the array (for avatar, we only expect one)
        const imageData = Array.isArray(req.imageData)
          ? req.imageData[0]
          : req.imageData;

        // Only add image data to update if imageData exists and URLs are provided
        if (imageData && imageData.url) {
          updateData.avatar = imageData.url;
        }
        if (imageData && imageData.thumbnailUrl) {
          updateData.avatarThumbnail = imageData.thumbnailUrl;
        }
        if (imageData && imageData.mediumUrl) {
          updateData.avatarMediumUrl = imageData.mediumUrl;
        }

        // Store old avatar for cleanup after successful update
        req.oldAvatar = oldAvatar;
        req.newImageDetails = imageData
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

      // Delete old avatar after successful update
      if (req.oldAvatar?.url) {
        try {
          const imageService = require("../../core/services/image.service");
          await imageService.deleteImage(req.oldAvatar);
          console.log("Old avatar deleted successfully");
        } catch (deleteError) {
          console.warn("Failed to delete old avatar:", deleteError.message);
        }
      }

      const responseData = { user: updatedUser };
      if (req.newImageDetails) {
        responseData.avatar_url = req.newImageDetails.url;
        responseData.avatar_thumbnail = req.newImageDetails.thumbnailUrl;
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

  // Sync user (create or update user profile from any auth method)
  async syncUser(req, res) {
    try {
      // Haal syncData uit req.user in plaats van req.body
      const syncData = {
        firebaseUid: req.user.uid,
        email: req.user.email,
        displayName: req.user.displayName,
        photoURL: req.user.picture,
        emailVerified: req.user.emailVerified,
        providerData: req.user.firebase.firebase?.sign_in_provider
          ? [{ providerId: req.user.firebase.firebase.sign_in_provider }]
          : null,
      };

      console.log("Syncing user with data:", JSON.stringify(syncData, null, 2));

      const result = await userService.syncUser(syncData);

      await this.deleteCache(`user_profile:${req.user.uid}`);

      const isNewUser = result.createdAt && !result.updatedAt;
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

module.exports = new AuthController();
