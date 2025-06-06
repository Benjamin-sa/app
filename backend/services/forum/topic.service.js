/**
 * Topic Service for Forum
 * Handles all topic-related operations
 */

const admin = require("firebase-admin");
const { COLLECTIONS, validators } = require("../../models/forum.models");
const imageService = require("../image.service");

const db = admin.firestore();

class TopicService {
  async createTopic(topicData, uploadedFiles = []) {
    try {
      // Validate topic data
      if (!validators.isValidTopicTitle(topicData.title)) {
        throw new Error("Title must be between 5 and 200 characters");
      }

      if (!validators.isValidContent(topicData.content)) {
        throw new Error("Content must be between 10 and 10000 characters");
      }

      if (!validators.isValidCategory(topicData.category)) {
        throw new Error("Valid category is required");
      }

      // Process uploaded files
      let imageRecords = [];
      if (uploadedFiles.length > 0) {
        imageRecords = await imageService.uploadMultipleImages(
          uploadedFiles,
          "forum/topics"
        );
      }

      // Combine uploaded images with existing image URLs
      const allImages = [
        ...imageRecords,
        ...(topicData.images || []).map((url) => ({
          url,
          thumbnailUrl: url,
          mediumUrl: url,
        })),
      ];

      // Get author info
      const authorDoc = await db
        .collection(COLLECTIONS.USERS)
        .doc(topicData.authorId)
        .get();
      const authorData = authorDoc.exists ? authorDoc.data() : null;

      // Create topic document
      const topicDoc = {
        title: topicData.title.trim(),
        content: topicData.content.trim(),
        authorId: topicData.authorId,
        authorDisplayName:
          authorData?.displayName || authorData?.username || "Anonymous",
        authorAvatar: authorData?.avatar || "",
        category: topicData.category,
        tags: topicData.tags || [],
        images: allImages,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        viewCount: 0,
        answerCount: 0,
        isPinned: false,
        isLocked: false,
        isDeleted: false,
        votes: {
          upvotes: 0,
          downvotes: 0,
          score: 0,
        },
      };

      // Create topic in Firestore
      const topicRef = await db.collection(COLLECTIONS.TOPICS).add(topicDoc);

      // Update user stats
      if (authorDoc.exists) {
        await authorDoc.ref.update({
          topics_created: admin.firestore.FieldValue.increment(1),
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Return created topic with ID
      return {
        id: topicRef.id,
        ...topicDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
      };
    } catch (error) {
      console.error("Error creating topic:", error);
      throw error;
    }
  }

  async getTopics(options = {}) {
    try {
      const { limit = 20 } = options;

      // Simple query without any where clauses or ordering to avoid index requirements
      const snapshot = await db
        .collection(COLLECTIONS.TOPICS)
        .limit(parseInt(limit))
        .get();

      // Filter out deleted topics and apply any sorting in memory
      const topics = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastActivity: data.lastActivity?.toDate(),
          };
        })
        .filter((topic) => !topic.isDeleted)
        .sort(
          (a, b) => (b.createdAt || new Date(0)) - (a.createdAt || new Date(0))
        )
        .slice(0, parseInt(limit));

      return {
        topics,
        hasMore: snapshot.size === parseInt(limit),
      };
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw error;
    }
  }

  async getTopicById(topicId, userId = null) {
    try {
      const topicDoc = await db
        .collection(COLLECTIONS.TOPICS)
        .doc(topicId)
        .get();

      if (!topicDoc.exists) {
        return null;
      }

      const topicData = topicDoc.data();

      if (topicData.isDeleted) {
        return null;
      }

      // Increment view count (async, don't wait)
      this.incrementViewCount(topicId);

      // Get user's vote if logged in
      let userVote = null;
      if (userId) {
        const voteDoc = await db
          .collection(COLLECTIONS.VOTES)
          .where("userId", "==", userId)
          .where("targetId", "==", topicId)
          .where("targetType", "==", "topic")
          .limit(1)
          .get();

        if (!voteDoc.empty) {
          userVote = voteDoc.docs[0].data().voteType;
        }
      }

      return {
        id: topicDoc.id,
        ...topicData,
        userVote,
        createdAt: topicData.createdAt?.toDate(),
        updatedAt: topicData.updatedAt?.toDate(),
        lastActivity: topicData.lastActivity?.toDate(),
      };
    } catch (error) {
      console.error("Error fetching topic:", error);
      throw error;
    }
  }

  async incrementViewCount(topicId) {
    try {
      await db
        .collection(COLLECTIONS.TOPICS)
        .doc(topicId)
        .update({
          viewCount: admin.firestore.FieldValue.increment(1),
        });
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  }

  async searchTopics(searchTerm, options = {}) {
    try {
      const { limit = 20, category = null } = options;

      let query = db
        .collection(COLLECTIONS.TOPICS)
        .where("isDeleted", "==", false);

      if (category) {
        query = query.where("category", "==", category);
      }

      // Note: Firestore doesn't support full-text search natively
      // For production, you'd want to use Algolia or similar
      // For now, we'll do a simple title search
      const snapshot = await query
        .orderBy("lastActivity", "desc")
        .limit(100) // Get more docs to filter
        .get();

      const topics = [];
      const searchLower = searchTerm.toLowerCase();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const titleMatch = data.title.toLowerCase().includes(searchLower);
        const contentMatch = data.content.toLowerCase().includes(searchLower);
        const tagMatch = data.tags.some((tag) =>
          tag.toLowerCase().includes(searchLower)
        );

        if (titleMatch || contentMatch || tagMatch) {
          topics.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastActivity: data.lastActivity?.toDate(),
          });
        }
      });

      return topics.slice(0, limit);
    } catch (error) {
      console.error("Error searching topics:", error);
      throw error;
    }
  }

  async getForumStats() {
    try {
      const [topicsSnapshot, usersSnapshot] = await Promise.all([
        db.collection(COLLECTIONS.TOPICS).where("isDeleted", "==", false).get(),
        db.collection(COLLECTIONS.USERS).get(),
      ]);

      const totalViews = topicsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().viewCount || 0);
      }, 0);

      const totalAnswers = topicsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().answerCount || 0);
      }, 0);

      return {
        totalUsers: usersSnapshot.size,
        totalTopics: topicsSnapshot.size,
        totalAnswers,
        totalViews,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error("Error getting forum stats:", error);
      throw error;
    }
  }
}

module.exports = new TopicService();
