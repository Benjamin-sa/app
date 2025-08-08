import firebaseQueries = require("../../../queries/FirebaseQueries");

class CategoryService {
  async getCategoriesWithStats() {
    const categories = await (firebaseQueries as any).getCategories();
    const categoriesWithStats = await Promise.all(
      categories.map(async (category: any) => {
        try {
          const stats = await (firebaseQueries as any).getCategoryStatistics(
            category.id
          );
          return {
            ...category,
            topicCount: stats.topicCount,
            totalViews: stats.totalViews,
            lastActivity: stats.lastActivity,
          };
        } catch (e: any) {
          console.warn(
            `Failed to get stats for category ${category.id}:`,
            e.message
          );
          return category;
        }
      })
    );
    return categoriesWithStats;
  }

  getCategoryStatistics(categoryId: string) {
    return (firebaseQueries as any).getCategoryStatistics(categoryId);
  }

  refreshAllCategoryStatistics() {
    return (firebaseQueries as any).refreshAllCategoryStatistics();
  }
}

const categoryService = new CategoryService();
export default categoryService;
module.exports = categoryService;
