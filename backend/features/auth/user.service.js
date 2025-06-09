/**
 * User Service for Forum
 * Handles all user-related operations
 */

const firebaseQueries = require("../../queries/firebase.queries");
const { UserProfile } = require("../../models/forum.models");
const ValidationUtils = require("../../utils/validation.utils");

class UserService {
  constructor() {
    this.queries = firebaseQueries;
  }

  async createUserProfile(userData) {
    try {
      const {
        uid,
        email,
        username,
        displayName,
        avatar,
        emailVerified,
        authProvider,
      } = userData;

      // All validation in clean, single lines that throw errors automatically
      ValidationUtils.required(
        { uid, email, username },
        "USER",
        "create user profile"
      );
      ValidationUtils.email(email, "USER");
      ValidationUtils.username(username, "USER");

      // Check if username is taken (but allow if it's the same user)
      const existingUserWithUsername = await this._checkUserExists(
        "username",
        username
      );
      if (existingUserWithUsername && existingUserWithUsername.uid !== uid) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Username is already taken"
        );
      }

      const userProfile = {
        ...UserProfile,
        uid,
        username,
        email,
        displayName: displayName || username,
        avatar: avatar || "",
        joinedDate: this.queries.getServerTimestamp(),
        lastActive: this.queries.getServerTimestamp(),
        updatedAt: this.queries.getServerTimestamp(),
        isVerified: emailVerified || false,
        authProvider: authProvider || "email",
      };

      console.log(
        `Creating user profile for UID: ${uid}, Username: ${username}`
      );

      await this.queries.createUser(uid, userProfile);
      return userProfile;
    } catch (error) {
      if (error.message.startsWith("USER_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `USER_SERVICE_ERROR: Failed to create user profile - ${error.message}`
      );
    }
  }

  async getUserProfile(uid, viewerUid = null) {
    try {
      ValidationUtils.required({ uid }, "USER", "get user profile");

      const user = await this.queries.getUserById(uid);

      if (!user) {
        throw new Error("USER_SERVICE_NOT_FOUND_ERROR: User profile not found");
      }

      // If viewing own profile, return full data, otherwise sanitize
      const isOwnProfile = viewerUid === uid;

      if (isOwnProfile) {
        return user; // Return complete profile for own profile
      } else {
        return this._sanitizeUserProfile(user); // Return sanitized profile for others
      }
    } catch (error) {
      if (error.message.startsWith("USER_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `USER_SERVICE_ERROR: Failed to get user profile - ${error.message}`
      );
    }
  }

  async getUserByUsername(username) {
    try {
      ValidationUtils.required({ username }, "USER", "get user by username");
      ValidationUtils.username(username, "USER");

      const user = await this.queries.getUserByUsername(username);

      if (!user) {
        throw new Error("USER_SERVICE_NOT_FOUND_ERROR: User not found");
      }

      return user;
    } catch (error) {
      if (error.message.startsWith("USER_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `USER_SERVICE_ERROR: Failed to get user by username - ${error.message}`
      );
    }
  }

  async updateUserActivity(uid) {
    try {
      ValidationUtils.required({ uid }, "USER", "update user activity");

      await this.queries.updateUserActivity(uid);
    } catch (error) {
      if (error.message.startsWith("USER_SERVICE_")) {
        throw error;
      }
      console.error("Failed to update user activity:", error);
    }
  }

  async incrementUserStats(uid, field) {
    try {
      ValidationUtils.required({ uid, field }, "USER", "increment user stats");

      const validFields = [
        "topicsCount",
        "answersCount",
        "votesReceived",
        "reputation",
      ];
      if (!validFields.includes(field)) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Invalid field for user stats"
        );
      }

      await this.queries.incrementUserStats(uid, field);
    } catch (error) {
      if (error.message.startsWith("USER_SERVICE_")) {
        throw error;
      }
      console.error(`Failed to increment user stat ${field}:`, error);
      throw new Error(
        `USER_SERVICE_ERROR: Failed to increment user stat - ${error.message}`
      );
    }
  }

  async updateUserProfile(uid, updateData) {
    try {
      ValidationUtils.required({ uid }, "USER", "update user profile");

      if (!updateData || Object.keys(updateData).length === 0) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Update data is required"
        );
      }

      const allowedFields = [
        "username",
        "displayName",
        "bio",
        "location",
        "website",
        "avatar",
        "avatarThumbnail",
        "avatarMediumUrl",
        "show_email",
        "allow_messages",
        "interests",
        "social_links",
        "email",
        "emailVerified",
        "authProvider",
        "lastLogin",
      ];

      // Filter out non-allowed fields
      const filteredData = {};
      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          filteredData[key] = updateData[key];
        }
      });

      // Validate username if it's being updated
      if (filteredData.username) {
        ValidationUtils.username(filteredData.username, "USER");

        // Check if username is already taken by another user
        const existingUser = await this._checkUserExists(
          "username",
          filteredData.username
        );
        if (existingUser && existingUser.uid !== uid) {
          throw new Error(
            "USER_SERVICE_VALIDATION_ERROR: Username is already taken"
          );
        }
      }

      // Validate other fields
      [
        "email",
        "displayName",
        "bio",
        "website",
        "location",
        "interests",
      ].forEach((field) => {
        if (updateData[field] !== undefined) {
          ValidationUtils[field](updateData[field], "USER");
        }
      });

      if (updateData.social_links !== undefined) {
        ValidationUtils.socialLinks(updateData.social_links, "USER");
      }

      // Add update timestamp
      filteredData.updatedAt = this.queries.getServerTimestamp();

      // Update the user profile
      await this.queries.updateUser(uid, filteredData);

      // Return updated profile
      return await this.getUserProfile(uid);
    } catch (error) {
      if (error.message.startsWith("USER_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `USER_SERVICE_ERROR: Failed to update user profile - ${error.message}`
      );
    }
  }

  async syncUser(syncData) {
    try {
      const {
        firebaseUid,
        email,
        displayName,
        photoURL,
        emailVerified,
        providerData,
      } = syncData;

      ValidationUtils.required({ firebaseUid, email }, "USER", "sync user");
      ValidationUtils.email(email, "USER");

      // Simple check - does user exist?
      const existingUser = await this._checkUserExists("uid", firebaseUid);

      if (existingUser) {
        // User exists - update their info
        console.log(`Updating existing user: ${firebaseUid}`);

        const updateData = {
          email,
          emailVerified,
          authProvider: this._getAuthProvider(providerData),
          lastLogin: this.queries.getServerTimestamp(),
        };

        // Only update displayName and avatar if they're currently empty
        if (!existingUser.displayName && displayName) {
          updateData.displayName = displayName;
        }
        if (!existingUser.avatar && photoURL) {
          updateData.avatar = photoURL;
        }

        return await this.updateUserProfile(firebaseUid, updateData);
      } else {
        // User doesn't exist - create new one
        console.log(`Creating new user: ${firebaseUid}`);

        const username = await this._generateUniqueUsername(
          displayName || email?.split("@")[0]
        );

        const newUserData = {
          uid: firebaseUid,
          email,
          username,
          displayName: displayName || username,
          avatar: photoURL || "",
          emailVerified,
          authProvider: this._getAuthProvider(providerData),
        };

        return await this.createUserProfile(newUserData);
      }
    } catch (error) {
      if (error.message.startsWith("USER_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `USER_SERVICE_ERROR: Failed to sync user - ${error.message}`
      );
    }
  }

  // Helper function to generate unique username
  async _generateUniqueUsername(baseName) {
    try {
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

      while (true) {
        try {
          await this.getUserByUsername(username);
          // If we get here, username exists, try next one
          username = `${cleanName}_${counter}`;
          counter++;

          // Prevent infinite loops
          if (counter > 1000) {
            throw new Error(
              "USER_SERVICE_ERROR: Unable to generate unique username after 1000 attempts"
            );
          }
        } catch (error) {
          if (error.message.includes("NOT_FOUND_ERROR")) {
            // Username doesn't exist, we can use it
            break;
          } else {
            // Some other error occurred
            throw error;
          }
        }
      }

      return username;
    } catch (error) {
      throw new Error(
        `USER_SERVICE_ERROR: Failed to generate unique username - ${error.message}`
      );
    }
  }

  // Simple helper to check if user exists without throwing errors
  async _checkUserExists(field, value) {
    try {
      if (field === "uid") {
        return await this.queries.getUserById(value);
      } else if (field === "username") {
        return await this.queries.getUserByUsername(value);
      }
      return null;
    } catch (error) {
      // If user doesn't exist, return null instead of throwing
      return null;
    }
  }

  // Helper function to determine auth provider
  _getAuthProvider(providerData) {
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

  // Helper method to sanitize user profile for public viewing
  _sanitizeUserProfile(user) {
    // Private fields that should never be shown publicly
    const privateFields = [
      "email", // Only shown if show_email is true
      "emailVerified",
      "authProvider",
      "updatedAt",
      "isDeleted",
      "isBanned",
      "banReason",
      "banExpiresAt",
      "lastLogin",
    ];

    // Create sanitized profile by filtering out private fields
    const publicProfile = {};
    Object.keys(user).forEach((key) => {
      if (!privateFields.includes(key)) {
        publicProfile[key] = user[key];
      }
    });

    // Only include email if user allows it to be shown publicly
    if (user.show_email) {
      publicProfile.email = user.email;
    }

    return publicProfile;
  }
}

module.exports = new UserService();
