/**
 * User Service for Forum
 * Handles all user-related operations
 */

const firebaseQueries = require("../../queries/firebase.queries");
const { validators, UserProfile } = require("../../models/forum.models");

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

      if (!uid || !email || !username) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: UID, email, and username are required"
        );
      }

      if (!validators.isValidEmail(email)) {
        throw new Error("USER_SERVICE_VALIDATION_ERROR: Invalid email format");
      }

      if (!validators.isValidUsername(username)) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Username must be 3-20 characters and contain only letters, numbers, and underscores"
        );
      }

      const existingUser = await this.getUserByUsername(username);
      if (existingUser && existingUser.uid !== uid) {
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

  async getUserProfile(uid) {
    try {
      if (!uid) {
        throw new Error("USER_SERVICE_VALIDATION_ERROR: User ID is required");
      }

      const user = await this.queries.getUserById(uid);

      if (!user) {
        throw new Error("USER_SERVICE_NOT_FOUND_ERROR: User profile not found");
      }

      return user;
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
      if (!username) {
        throw new Error("USER_SERVICE_VALIDATION_ERROR: Username is required");
      }

      if (!validators.isValidUsername(username)) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Invalid username format"
        );
      }

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
      if (!uid) {
        throw new Error("USER_SERVICE_VALIDATION_ERROR: User ID is required");
      }

      await this.queries.updateUserActivity(uid);
    } catch (error) {
      if (error.message.startsWith("USER_SERVICE_")) {
        throw error;
      }
      console.error("Failed to update user activity:", error);
      throw new Error(
        `USER_SERVICE_ERROR: Failed to update user activity - ${error.message}`
      );
    }
  }

  async incrementUserStats(uid, field) {
    try {
      if (!uid) {
        throw new Error("USER_SERVICE_VALIDATION_ERROR: User ID is required");
      }

      if (!field) {
        throw new Error("USER_SERVICE_VALIDATION_ERROR: Field is required");
      }

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
      if (!uid) {
        throw new Error("USER_SERVICE_VALIDATION_ERROR: User ID is required");
      }

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

      if (Object.keys(filteredData).length === 0) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: No valid fields to update"
        );
      }

      // Validate username if it's being updated
      if (filteredData.username) {
        if (!validators.isValidUsername(filteredData.username)) {
          throw new Error(
            "USER_SERVICE_VALIDATION_ERROR: Username must be 3-20 characters and contain only letters, numbers, and underscores"
          );
        }

        // Check if username is already taken by another user
        try {
          const existingUser = await this.queries.getUserByUsername(
            filteredData.username
          );
          if (existingUser && existingUser.uid !== uid) {
            throw new Error(
              "USER_SERVICE_VALIDATION_ERROR: Username is already taken"
            );
          }
        } catch (error) {
          if (!error.message.includes("NOT_FOUND_ERROR")) {
            throw error;
          }
        }
      }

      // Validate other fields
      if (filteredData.bio && !validators.isValidBio(filteredData.bio)) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Bio must be 500 characters or less"
        );
      }

      if (
        filteredData.website &&
        !validators.isValidWebsite(filteredData.website)
      ) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Invalid website URL format"
        );
      }

      if (
        filteredData.location &&
        !validators.isValidLocation(filteredData.location)
      ) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Location must be 100 characters or less"
        );
      }

      if (
        filteredData.interests &&
        !validators.isValidInterests(filteredData.interests)
      ) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Maximum 10 interests allowed"
        );
      }

      if (
        filteredData.social_links &&
        !validators.isValidSocialLinks(filteredData.social_links)
      ) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Maximum 5 social links allowed"
        );
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

      // Validate required fields
      if (!firebaseUid || !email) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Firebase UID and email are required"
        );
      }

      if (!validators.isValidEmail(email)) {
        throw new Error("USER_SERVICE_VALIDATION_ERROR: Invalid email format");
      }

      // Check if user already exists
      let existingUser;
      try {
        existingUser = await this.getUserProfile(firebaseUid);
      } catch (error) {
        if (!error.message.includes("NOT_FOUND_ERROR")) {
          throw error;
        }
        existingUser = null;
      }

      if (existingUser) {
        // Update existing user
        const updateData = {
          email,
          displayName,
          avatar: photoURL || existingUser.avatar,
          emailVerified,
          authProvider: this._getAuthProvider(providerData),
          lastLogin: this.queries.getServerTimestamp(),
        };

        // Remove undefined fields
        Object.keys(updateData).forEach((key) => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        return await this.updateUserProfile(firebaseUid, updateData);
      } else {
        // Create new user
        const username = await this._generateUniqueUsername(
          displayName || email?.split("@")[0]
        );

        const newUserData = {
          uid: firebaseUid,
          email,
          username,
          displayName: displayName || username,
          avatar: photoURL,
          emailVerified,
          authProvider: this._getAuthProvider(providerData),
          createdAt: this.queries.getServerTimestamp(),
          lastLogin: this.queries.getServerTimestamp(),
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
}

module.exports = new UserService();
