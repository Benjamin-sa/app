const { auth } = require("../config/firebase");
const userService = require("../services/forum/user.service");
const imageService = require("../services/image.service");
const firebaseQueries = require("../queries/firebase.queries");

class AuthController {
  // Get current user info (protected route)
  async getMe(req, res) {
    try {
      const userRecord = await userService.getUserProfile(req.user.uid);

      res.json({
        success: true,
        data: userRecord,
      });
    } catch (error) {
      console.error("AUTH_CONTROLLER_ERROR: Get User Error:", error);

      // Determine status code based on error type
      let statusCode = 500;
      if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      } else if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        error: `AUTH_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "auth_controller",
      });
    }
  }

  // Update user profile
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

      const updateData = {
        username,
        displayName,
        bio,
        location,
        website,
        show_email: show_email === "true" || show_email === true,
        allow_messages: allow_messages === "true" || allow_messages === true,
      };

      // Remove undefined/empty fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined || updateData[key] === "") {
          delete updateData[key];
        }
      });

      let newImageRecordDetails = null;
      let oldAvatarForDeletion = null;

      // Handle file upload
      if (req.file) {
        console.log("Processing file upload:", req.file.originalname);

        try {
          // Get current user profile to check for existing avatar
          const currentUser = await userService.getUserProfile(req.user.uid);
          if (currentUser && currentUser.avatar) {
            oldAvatarForDeletion = {
              url: currentUser.avatar,
              thumbnailUrl: currentUser.avatarThumbnail,
            };
          }

          // Upload new avatar image
          const uploadedImageRecord = await imageService.uploadImage(
            req.file,
            `forum/avatars/${req.user.uid}`
          );

          if (uploadedImageRecord && uploadedImageRecord.url) {
            updateData.avatar = uploadedImageRecord.url;
            updateData.avatarThumbnail = uploadedImageRecord.thumbnailUrl;
            newImageRecordDetails = {
              url: uploadedImageRecord.url,
              thumbnailUrl: uploadedImageRecord.thumbnailUrl,
            };
            console.log("New avatar uploaded:", uploadedImageRecord.url);
          }
        } catch (imageError) {
          return res.status(400).json({
            success: false,
            error: `AUTH_CONTROLLER_ERROR: Image upload failed - ${imageError.message}`,
            errorSource: "auth_controller_image",
          });
        }
      }

      const updatedUser = await userService.updateUserProfile(
        req.user.uid,
        updateData
      );

      // Delete old avatar after successful profile update
      if (oldAvatarForDeletion && oldAvatarForDeletion.url) {
        try {
          await imageService.deleteImage(oldAvatarForDeletion);
          console.log("Old avatar deleted successfully");
        } catch (deleteError) {
          console.warn("Failed to delete old avatar:", deleteError.message);
        }
      }

      const responseData = {
        user: updatedUser,
      };

      if (newImageRecordDetails) {
        responseData.avatar_url = newImageRecordDetails.url;
        responseData.avatar_thumbnail = newImageRecordDetails.thumbnailUrl;
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: responseData,
      });
    } catch (error) {
      console.error("AUTH_CONTROLLER_ERROR: Profile Update Error:", error);

      // Determine status code based on error type
      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `AUTH_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "auth_controller",
      });
    }
  }

  // Sync user (create or update user profile from any auth method)
  async syncUser(req, res) {
    try {
      const syncData = req.body;

      const result = await userService.syncUser(syncData);

      if (result.createdAt && !result.updatedAt) {
        // New user created
        res.status(201).json({
          success: true,
          message: "User created successfully",
          data: result,
        });
      } else {
        // Existing user updated
        res.json({
          success: true,
          message: "User synced successfully",
          data: result,
        });
      }
    } catch (error) {
      console.error("AUTH_CONTROLLER_ERROR: User Sync Error:", error);

      // Determine status code based on error type
      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `AUTH_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "auth_controller",
      });
    }
  }
}

module.exports = new AuthController();
