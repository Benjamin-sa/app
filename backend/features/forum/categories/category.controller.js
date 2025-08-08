const BaseController = require("../../../core/controller/base.controller");
const firebaseQueries = require("../../../queries/FirebaseQueries");

class CategoryController extends BaseController {
  constructor() {
    super("CATEGORY");
  }

  /**
   * Get all categories with their statistics
   */
  async getCategories(req, res) {
    try {
      const cacheKey = "categories_with_stats";

      const categories = await this.getCachedData(
        cacheKey,
        async () => {
          const categories = await firebaseQueries.getCategories();

          // Get real-time statistics for each category
          const categoriesWithStats = await Promise.all(
            categories.map(async (category) => {
              try {
                const stats = await firebaseQueries.getCategoryStatistics(
                  category.id
                );
                return {
                  ...category,
                  topicCount: stats.topicCount,
                  totalViews: stats.totalViews,
                  lastActivity: stats.lastActivity,
                };
              } catch (error) {
                console.warn(
                  `Failed to get stats for category ${category.id}:`,
                  error.message
                );
                return category; // Return category without updated stats
              }
            })
          );

          return categoriesWithStats;
        },
        300 // Cache for 5 minutes
      );

      this.sendSuccess(res, categories);
    } catch (error) {
      this.handleError(res, error, "Get Categories");
    }
  }

  /**
   * Get statistics for a specific category
   */
  async getCategoryStats(req, res) {
    try {
      const { categoryId } = req.params;
      const cacheKey = `category_stats:${categoryId}`;

      const stats = await this.getCachedData(
        cacheKey,
        () => firebaseQueries.getCategoryStatistics(categoryId),
        180 // Cache for 3 minutes
      );

      this.sendSuccess(res, stats);
    } catch (error) {
      this.handleError(res, error, "Get Category Stats");
    }
  }

  /**
   * Refresh all category statistics (admin endpoint)
   */
  async refreshStats(req, res) {
    try {
      // This could be protected by admin middleware
      await firebaseQueries.refreshAllCategoryStatistics();

      // Clear related caches
      await this.invalidateCache("categories_with_stats");
      await this.invalidateCache("category_stats:*");

      this.sendSuccess(res, {
        message: "Category statistics refreshed successfully",
      });
    } catch (error) {
      this.handleError(res, error, "Refresh Category Stats");
    }
  }
}

module.exports = new CategoryController();
