/**
 * User Service for Forum
 * Handles all user-related operations
 */

const firebaseQueries = require("../../queries/FirebaseQueries");
const { UserProfile } = require("../../models/forum.models");
const {
  createUserProfile,
  updateUserProfile,
  ValidationError,
  validateId,
} = require("../../utils/validation.utils");

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

      // Use new validation system - automatically validates all fields
      const validatedProfile = createUserProfile({
        uid,
        email,
        username,
        displayName: displayName || username,
        avatar: avatar || "",
        isVerified: emailVerified || false,
      });

      // Check if username is taken (but allow if it's the same user)
      const existingUserWithUsername = await this._checkUserExists(
        "username",
        validatedProfile.username
      );

      if (
        existingUserWithUsername &&
        existingUserWithUsername.uid !== validatedProfile.uid
      ) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Username is already taken"
        );
      }

      // Add additional fields not in validation schema
      validatedProfile.joinedDate = this.queries.getServerTimestamp();
      validatedProfile.lastActive = this.queries.getServerTimestamp();
      validatedProfile.updatedAt = this.queries.getServerTimestamp();
      validatedProfile.authProvider = authProvider || "email";

      await this.queries.createUser(validatedProfile.uid, validatedProfile);
      return validatedProfile;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
      if (error instanceof ValidationError) {
        throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
      // Validate username - will throw ValidationError if invalid
      const validatedData = createUserProfile({
        username,
        uid: "temp",
        email: "temp@temp.com",
      });

      const user = await this.queries.getUserByUsername(validatedData.username);

      if (!user) {
        throw new Error("USER_SERVICE_NOT_FOUND_ERROR: User not found");
      }

      return user;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
      const validatedUid = validateId(uid, "uid");
      await this.queries.updateUserActivity(validatedUid);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      if (error.message.startsWith("USER_SERVICE_")) {
        throw error;
      }
      console.error("Failed to update user activity:", error);
    }
  }

  async incrementUserStats(uid, field) {
    try {
      const validatedUid = validateId(uid, "uid");

      if (!field || typeof field !== "string") {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Field is required and must be a string"
        );
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

      await this.queries.incrementUserStats(validatedUid, field);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
      const validatedUid = validateId(uid, "uid");

      if (!updateData || Object.keys(updateData).length === 0) {
        throw new Error(
          "USER_SERVICE_VALIDATION_ERROR: Update data is required"
        );
      }

      // Use new validation system for updates (relaxed validation)
      const validatedData = updateUserProfile(updateData);

      // Check username uniqueness if it's being updated
      if (validatedData.username) {
        const existingUser = await this._checkUserExists(
          "username",
          validatedData.username
        );
        if (existingUser && existingUser.uid !== validatedUid) {
          throw new Error(
            "USER_SERVICE_VALIDATION_ERROR: Username is already taken"
          );
        }
      }

      // Add update timestamp
      validatedData.updatedAt = this.queries.getServerTimestamp();

      // Update the user profile
      await this.queries.updateUser(validatedUid, validatedData);

      // Return updated profile
      return await this.getUserProfile(validatedUid);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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

      // Validate required fields using our validation system
      const validatedUid = validateId(firebaseUid, "firebaseUid");

      // Validate email format
      const validatedProfile = createUserProfile({
        uid: validatedUid,
        email,
        username: "temp", // temporary, will be generated
      });

      // Simple check - does user exist?
      const existingUser = await this._checkUserExists("uid", validatedUid);

      if (existingUser) {
        // User exists - update their info
        console.log(`Updating existing user: ${validatedUid}`);

        const updateData = {
          email: validatedProfile.email,
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

        return await this.updateUserProfile(validatedUid, updateData);
      } else {
        // User doesn't exist - create new one
        console.log(`Creating new user: ${validatedUid}`);

        const username = await this._generateUniqueUsername(
          displayName || validatedProfile.email?.split("@")[0]
        );

        const newUserData = {
          uid: validatedUid,
          email: validatedProfile.email,
          username,
          displayName: displayName || username,
          avatar: photoURL || "",
          emailVerified,
          authProvider: this._getAuthProvider(providerData),
        };

        return await this.createUserProfile(newUserData);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
