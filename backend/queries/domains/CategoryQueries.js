/**
 * Category Queries
 * Handles all category-related Firebase operations
 */

const BaseFirebaseQueries = require("../base/BaseFirebaseQueries");
const { COLLECTIONS } = require("../../models/forum.models");

class CategoryQueries extends BaseFirebaseQueries {
  /**
   * Get all categories
   */
  async getCategories() {
    const snapshot = await this.db
      .collection(COLLECTIONS.CATEGORIES)
      .orderBy("sortOrder")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Create or update category
   */
  async upsertCategory(categoryId, categoryData) {
    return await this.db
      .collection(COLLECTIONS.CATEGORIES)
      .doc(categoryId)
      .set(categoryData, { merge: true });
  }

  /**
   * Update category topic count
   */
  async updateCategoryTopicCount(categoryId, increment = 1) {
    return await this.incrementField(
      COLLECTIONS.CATEGORIES,
      categoryId,
      "topicCount",
      increment,
      "Failed to update category topic count"
    );
  }

  /**
   * Update category total views
   */
  async updateCategoryViews(categoryId, increment = 1) {
    return await this.incrementField(
      COLLECTIONS.CATEGORIES,
      categoryId,
      "totalViews",
      increment,
      "Failed to update category views"
    );
  }

  /**
   * Update category last activity
   */
  async updateCategoryLastActivity(categoryId, activityData) {
    return await this.executeQuery(async () => {
      await this.db
        .collection(COLLECTIONS.CATEGORIES)
        .doc(categoryId)
        .update({
          lastActivity: {
            topicId: activityData.topicId,
            topicTitle: activityData.topicTitle,
            userId: activityData.userId,
            userName: activityData.userName,
            userAvatar: activityData.userAvatar || null,
            timestamp: this.FieldValue.serverTimestamp(),
          },
          updatedAt: this.FieldValue.serverTimestamp(),
        });
    }, "Failed to update category last activity");
  }

  /**
   * Get category statistics with real-time aggregation
   */
  async getCategoryStatistics(categoryId) {
    return await this.executeQuery(async () => {
      // Get topic count and total views by aggregating topics
      const topicsSnapshot = await this.db
        .collection(COLLECTIONS.TOPICS)
        .where("category", "==", categoryId)
        .where("isDeleted", "==", false)
        .get();

      const topics = topicsSnapshot.docs.map(doc => doc.data());
      const topicCount = topics.length;
      const totalViews = topics.reduce((sum, topic) => sum + (topic.viewCount || 0), 0);

      // Get last activity (most recent topic or answer in this category)
      const lastTopic = topics
        .sort((a, b) => {
          const aTime = a.lastActivity?.toMillis?.() || a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
          const bTime = b.lastActivity?.toMillis?.() || b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        })[0];

      let lastActivity = null;
      if (lastTopic) {
        // Get user info for last activity
        const userDoc = await this.db
          .collection(COLLECTIONS.USERS)
          .doc(lastTopic.userId)
          .get();
        
        const userData = userDoc.exists ? userDoc.data() : {};
        
        lastActivity = {
          topicId: lastTopic.id,
          topicTitle: lastTopic.title,
          userId: lastTopic.userId,
          userName: userData.displayName || userData.username || 'Anonymous',
          userAvatar: userData.avatar || null,
          timestamp: lastTopic.lastActivity || lastTopic.updatedAt || lastTopic.createdAt,
        };
      }

      return {
        topicCount,
        totalViews,
        lastActivity,
      };
    }, "Failed to get category statistics");
  }

  /**
   * Refresh all category statistics
   */
  async refreshAllCategoryStatistics() {
    return await this.executeQuery(async () => {
      const categoriesSnapshot = await this.db
        .collection(COLLECTIONS.CATEGORIES)
        .get();

      const updatePromises = categoriesSnapshot.docs.map(async (categoryDoc) => {
        const categoryId = categoryDoc.id;
        const stats = await this.getCategoryStatistics(categoryId);
        
        return this.db
          .collection(COLLECTIONS.CATEGORIES)
          .doc(categoryId)
          .update({
            topicCount: stats.topicCount,
            totalViews: stats.totalViews,
            lastActivity: stats.lastActivity,
            updatedAt: this.FieldValue.serverTimestamp(),
          });
      });

      await Promise.all(updatePromises);
    }, "Failed to refresh category statistics");
  }
}

module.exports = CategoryQueries;
