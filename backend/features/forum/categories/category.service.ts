import firebaseQueries = require("../../../queries/FirebaseQueries");

class CategoryService {
  async getCategoriesWithStats() {
    const categories = await (firebaseQueries as any).getCategories();
    return categories;
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
