/**
 * Category Statistics Service
 * Handles automatic updates and maintenance of category statistics
 */

const firebaseQueries = require("../queries/FirebaseQueries");

class CategoryStatsService {
  constructor() {
    this.updateInterval = null;
    this.isRunning = false;
  }

  /**
   * Start automatic statistics updates
   * @param {number} intervalMinutes - How often to update statistics (default: 30 minutes)
   */
  startPeriodicUpdates(intervalMinutes = 30) {
    if (this.isRunning) {
      console.log("Category stats service is already running");
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(
      `Starting category statistics service (updates every ${intervalMinutes} minutes)`
    );

    // Run initial update
    this.updateAllCategoryStatistics();

    // Schedule periodic updates
    this.updateInterval = setInterval(() => {
      this.updateAllCategoryStatistics();
    }, intervalMs);

    this.isRunning = true;
  }

  /**
   * Stop automatic statistics updates
   */
  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log("Category statistics service stopped");
  }

  /**
   * Update statistics for all categories
   */
  async updateAllCategoryStatistics() {
    try {
      console.log("Updating category statistics...");
      const startTime = Date.now();

      await firebaseQueries.refreshAllCategoryStatistics();

      const duration = Date.now() - startTime;
      console.log(`Category statistics updated successfully in ${duration}ms`);
    } catch (error) {
      console.error("Failed to update category statistics:", error);
    }
  }

  /**
   * Update statistics for a specific category
   */
  async updateCategoryStatistics(categoryId) {
    try {
      const stats = await firebaseQueries.getCategoryStatistics(categoryId);
      await firebaseQueries.upsertCategory(categoryId, {
        topicCount: stats.topicCount,
        totalViews: stats.totalViews,
        lastActivity: stats.lastActivity,
        updatedAt: new Date().toISOString(),
      });

      console.log(`Updated statistics for category: ${categoryId}`);
      return stats;
    } catch (error) {
      console.error(
        `Failed to update statistics for category ${categoryId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get current service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: !!this.updateInterval,
    };
  }
}

// Create singleton instance
const categoryStatsService = new CategoryStatsService();

module.exports = categoryStatsService;
