/**
 * User Service for Forum
 * Handles all user-related operations
 */

const { firestore } = require("../../config/firebase");
const admin = require("firebase-admin");
const { COLLECTIONS, validators } = require("../../models/forum.models");

class UserService {
  constructor() {
    this.db = firestore;
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
        throw new Error("UID, email, and username are required");
      }

      if (!validators.isValidEmail(email)) {
        throw new Error("Invalid email format");
      }

      if (!validators.isValidUsername(username)) {
        throw new Error(
          "Username must be 3-20 characters and contain only letters, numbers, and underscores"
        );
      }

      const existingUser = await this.getUserByUsername(username);
      if (existingUser && existingUser.uid !== uid) {
        throw new Error("Username is already taken");
      }

      const userProfile = {
        uid,
        username,
        email,
        displayName: displayName || username,
        avatar: avatar || "",
        bio: "",
        location: "",
        website: "",
        joinedDate: admin.firestore.FieldValue.serverTimestamp(),
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        reputation: 0,
        topics_created: 0,
        answers_posted: 0,
        products_count: 0,
        isVerified: emailVerified || false,
        isAdmin: false,
        isModerator: false,
        show_email: false,
        allow_messages: true,
        interests: [],
        social_links: {},
        authProvider: authProvider || "email",
      };

      await this.db
        .collection(COLLECTIONS.USERS)
        .doc(uid)
        .set(userProfile, { merge: true });
      return userProfile;
    } catch (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
  }

  async getUserProfile(uid) {
    try {
      const doc = await this.db.collection(COLLECTIONS.USERS).doc(uid).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  async getUserByUsername(username) {
    try {
      const snapshot = await this.db
        .collection(COLLECTIONS.USERS)
        .where("username", "==", username)
        .limit(1)
        .get();

      return snapshot.empty
        ? null
        : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
      throw new Error(`Failed to get user by username: ${error.message}`);
    }
  }

  async updateUserActivity(uid) {
    try {
      await this.db.collection(COLLECTIONS.USERS).doc(uid).update({
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to update user activity:", error);
    }
  }

  async incrementUserStats(uid, field) {
    try {
      await this.db
        .collection(COLLECTIONS.USERS)
        .doc(uid)
        .update({
          [field]: admin.firestore.FieldValue.increment(1),
        });
    } catch (error) {
      console.error(`Failed to increment user stat ${field}:`, error);
    }
  }

  async updateUserProfile(uid, updateData) {
    try {
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
        if (!validators.isValidUsername(filteredData.username)) {
          throw new Error(
            "Username must be 3-20 characters and contain only letters, numbers, and underscores"
          );
        }

        // Check if username is already taken by another user
        const existingUser = await this.getUserByUsername(
          filteredData.username
        );
        if (existingUser && existingUser.uid !== uid) {
          throw new Error("Username is already taken");
        }
      }

      // Validate other fields
      if (filteredData.bio && !validators.isValidBio(filteredData.bio)) {
        throw new Error("Bio must be 500 characters or less");
      }

      if (
        filteredData.website &&
        !validators.isValidWebsite(filteredData.website)
      ) {
        throw new Error("Invalid website URL format");
      }

      if (
        filteredData.location &&
        !validators.isValidLocation(filteredData.location)
      ) {
        throw new Error("Location must be 100 characters or less");
      }

      if (
        filteredData.interests &&
        !validators.isValidInterests(filteredData.interests)
      ) {
        throw new Error("Maximum 10 interests allowed");
      }

      if (
        filteredData.social_links &&
        !validators.isValidSocialLinks(filteredData.social_links)
      ) {
        throw new Error("Maximum 5 social links allowed");
      }

      // Add update timestamp
      filteredData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      // Update the user profile
      await this.db.collection(COLLECTIONS.USERS).doc(uid).update(filteredData);

      // Return updated profile
      return await this.getUserProfile(uid);
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  async getUserByIdentifier(identifier) {
    try {
      // First try to get by UID
      let user = await this.getUserProfile(identifier);

      // If not found, try by username
      if (!user) {
        user = await this.getUserByUsername(identifier);
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to get user by identifier: ${error.message}`);
    }
  }
}

module.exports = new UserService();
