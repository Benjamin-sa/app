const { auth } = require("../config/firebase");
const userService = require("../services/forum/user.service");
const imageService = require("../services/image.service");
const { validators } = require("../models/forum.models");
const cacheService = require("../services/cache.service");

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const { email, password, username, displayName } = req.body;

      // Validate input
      if (!validators.isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email format",
        });
      }

      if (!validators.isValidUsername(username)) {
        return res.status(400).json({
          success: false,
          error: "Invalid username format",
        });
      }

      // Create Firebase user
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: displayName || username,
      });

      // Invalidate user-related cache
      await cacheService.invalidatePattern("user:*");

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          emailVerified: userRecord.emailVerified,
        },
      });
    } catch (error) {
      console.error("Registration Error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to create user",
      });
    }
  }

  // Login (Firebase handles authentication client-side, this is for server-side validation)
  async login(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Token is required",
        });
      }

      // Verify the token
      const decodedToken = await auth.verifyIdToken(token);

      res.json({
        success: true,
        message: "Login successful",
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          displayName: decodedToken.name,
          emailVerified: decodedToken.email_verified,
          picture: decodedToken.picture,
        },
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }
  }

  // Get current user info (protected route)
  async getMe(req, res) {
    try {
      const cacheKey = `user:profile:${req.user.uid}`;

      // Try to get from cache first
      let userRecord = await cacheService.get(cacheKey);

      if (!userRecord) {
        userRecord = await userService.getUserProfile(req.user.uid);

        if (userRecord) {
          // Cache for 5 minutes
          await cacheService.set(cacheKey, userRecord, 300);
        }
      }

      if (!userRecord) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        data: userRecord,
      });
    } catch (error) {
      console.error("Get User Error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get user information",
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
        avatar,
        show_email,
        allow_messages,
      } = req.body;

      const updateData = {
        username,
        displayName,
        bio,
        location,
        website,
        avatar,
        show_email,
        allow_messages,
      };

      // Remove undefined fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedUser = await userService.updateUserProfile(
        req.user.uid,
        updateData
      );

      // Invalidate user cache
      await cacheService.invalidatePattern(`user:*:${req.user.uid}`);
      await cacheService.invalidatePattern(`user:profile:${req.user.uid}`);

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error("Profile Update Error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to update profile",
      });
    }
  }

  // Upload avatar
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      // Get current user profile to check for existing avatar
      const currentUser = await userService.getUserProfile(req.user.uid);

      // Upload new avatar image using image service
      const imageRecord = await imageService.uploadImages(
        req.file,
        `forum/avatars/${req.user.uid}`
      );

      // Update user profile with new avatar URL
      const updatedUser = await userService.updateUserProfile(req.user.uid, {
        avatar: imageRecord.url,
        avatarThumbnail: imageRecord.thumbnailUrl,
      });

      // Delete old avatar after successful upload and profile update
      if (currentUser && currentUser.avatar && currentUser.avatarThumbnail) {
        try {
          await imageService.deleteImage(currentUser.avatar);
          await imageService.deleteImage(currentUser.avatarThumbnail);
        } catch (deleteError) {
          console.warn("Failed to delete old avatar:", deleteError.message);
        }
      }

      // Invalidate user cache
      await cacheService.invalidatePattern(`user:*:${req.user.uid}`);
      await cacheService.invalidatePattern(`user:profile:${req.user.uid}`);

      res.json({
        success: true,
        message: "Avatar uploaded successfully",
        data: {
          avatar_url: imageRecord.url,
          avatar_thumbnail: imageRecord.thumbnailUrl,
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error("Avatar Upload Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to upload avatar",
      });
    }
  }

  // Verify email
  async verifyEmail(req, res) {
    try {
      await auth.updateUser(req.user.uid, {
        emailVerified: true,
      });

      // Invalidate user cache
      await cacheService.invalidatePattern(`user:*:${req.user.uid}`);

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      console.error("Email Verification Error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify email",
      });
    }
  }

  // Sync user (create or update user profile from any auth method)
  async syncUser(req, res) {
    try {
      const {
        firebaseUid,
        email,
        displayName,
        photoURL,
        emailVerified,
        providerData,
      } = req.body;

      // Validate that the authenticated user matches the request
      if (req.user.uid !== firebaseUid) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized: UID mismatch",
        });
      }

      // Check if user already exists
      let existingUser = await userService.getUserProfile(firebaseUid);

      if (existingUser) {
        // Update existing user
        const updateData = {
          email,
          displayName,
          avatar: photoURL,
          emailVerified,
          authProvider: this.getAuthProvider(providerData),
          lastLogin: new Date(),
        };

        // Remove undefined fields
        Object.keys(updateData).forEach((key) => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        const updatedUser = await userService.updateUserProfile(
          firebaseUid,
          updateData
        );

        // Invalidate user cache
        await cacheService.invalidatePattern(`user:*:${firebaseUid}`);

        res.json({
          success: true,
          message: "User synced successfully",
          data: updatedUser,
        });
      } else {
        // Create new user
        const username = await this.generateUniqueUsername(
          displayName || email?.split("@")[0]
        );

        const newUserData = {
          uid: firebaseUid,
          email,
          username,
          displayName: displayName || username,
          avatar: photoURL,
          emailVerified,
          authProvider: this.getAuthProvider(providerData),
          createdAt: new Date(),
          lastLogin: new Date(),
        };

        const newUser = await userService.createUserProfile(newUserData);

        // Invalidate user cache
        await cacheService.invalidatePattern("user:*");

        res.status(201).json({
          success: true,
          message: "User created successfully",
          data: newUser,
        });
      }
    } catch (error) {
      console.error("User Sync Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to sync user",
      });
    }
  }

  // Helper function to generate unique username
  async generateUniqueUsername(baseName) {
    if (!baseName) {
      baseName = "user";
    }

    // Clean the base name to make it username-friendly
    let cleanName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    if (cleanName.length < 3) {
      cleanName = "user";
    }
    if (cleanName.length > 15) {
      cleanName = cleanName.substring(0, 15);
    }

    // Check if username exists
    let username = cleanName;
    let counter = 1;

    while (await userService.getUserByUsername(username)) {
      username = `${cleanName}_${counter}`;
      counter++;

      // Prevent infinite loops
      if (counter > 1000) {
        throw new Error("Unable to generate unique username");
      }
    }

    return username;
  }

  // Helper function to determine auth provider
  getAuthProvider(providerData) {
    if (
      !providerData ||
      !Array.isArray(providerData) ||
      providerData.length === 0
    ) {
      return "password";
    }

    const provider = providerData[0].providerId;
    switch (provider) {
      case "google.com":
        return "google";
      case "facebook.com":
        return "facebook";
      case "github.com":
        return "github";
      case "twitter.com":
        return "twitter";
      default:
        return "password";
    }
  }
}

module.exports = new AuthController();
