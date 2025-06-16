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
}

module.exports = CategoryQueries;
