/**
 * Bike Queries
 * Handles all bike-related Firebase operations
 */

const BaseFirebaseQueries = require("../base/BaseFirebaseQueries");
const { COLLECTIONS } = require("../../models/forum.models");

class BikeQueries extends BaseFirebaseQueries {
  /**
   * Create a new bike
   */
  async createBike(bikeData) {
    return await this.createDocument(
      COLLECTIONS.BIKES,
      bikeData,
      "Failed to create bike"
    );
  }

  /**
   * Get bike by ID
   */
  async getBikeById(bikeId) {
    return await this.getDocumentById(
      COLLECTIONS.BIKES,
      bikeId,
      "Failed to get bike by ID",
      true // Transform timestamps
    );
  }

  /**
   * Get all bikes for a specific user
   */
  async getBikesByUserId(userId, options = {}) {
    const {
      limit = 50,
      orderBy = "createdAt",
      orderDirection = "desc",
    } = options;

    return await this.executeQuery(async () => {
      const snapshot = await this.db
        .collection(COLLECTIONS.BIKES)
        .where("userId", "==", userId)
        .where("isDeleted", "==", false)
        .orderBy(orderBy, orderDirection)
        .limit(parseInt(limit))
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      });
    }, "Failed to get bikes by user ID");
  }

  /**
   * Update bike
   */
  async updateBike(bikeId, updateData) {
    return await this.updateDocument(
      COLLECTIONS.BIKES,
      bikeId,
      updateData,
      "Failed to update bike"
    );
  }

  /**
   * Soft delete bike
   */
  async deleteBike(bikeId) {
    return await this.softDeleteDocument(
      COLLECTIONS.BIKES,
      bikeId,
      "Failed to delete bike"
    );
  }

  /**
   * Count bikes by user ID
   */
  async countBikesByUserId(userId) {
    return await this.executeQuery(async () => {
      const snapshot = await this.db
        .collection(COLLECTIONS.BIKES)
        .where("userId", "==", userId)
        .where("isDeleted", "==", false)
        .get();

      return snapshot.size;
    }, "Failed to count user bikes");
  }

  /**
   * Get featured bikes
   */
  async getFeaturedBikes(options = {}) {
    const {
      limit = 10,
      orderBy = "createdAt",
      orderDirection = "desc",
    } = options;

    return await this.executeQuery(async () => {
      const snapshot = await this.db
        .collection(COLLECTIONS.BIKES)
        .where("isDeleted", "==", false)
        .where("is_featured", "==", true)
        .orderBy(orderBy, orderDirection)
        .limit(parseInt(limit))
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      });
    }, "Failed to get featured bikes");
  }

  /**
   * Increment bike view count
   */
  async incrementBikeViews(bikeId) {
    return await this.incrementField(
      COLLECTIONS.BIKES,
      bikeId,
      "view_count",
      1,
      "Failed to increment bike views"
    );
  }

  /**
   * Toggle bike featured status
   */
  async toggleBikeFeaturedStatus(bikeId, isFeatured) {
    return await this.executeQuery(
      () =>
        this.db.collection(COLLECTIONS.BIKES).doc(bikeId).update({
          is_featured: isFeatured,
          updatedAt: this.FieldValue.serverTimestamp(),
        }),
      "Failed to toggle bike featured status"
    );
  }

  /**
   * Get all bikes with pagination and filtering
   */
  async getAllBikes(options = {}) {
    const {
      page = 1,
      limit = 12,
      sort = "recent",
      search = "",
      engineSize = "",
    } = options;

    try {
      let query = this.db
        .collection(COLLECTIONS.BIKES)
        .where("isDeleted", "==", false);

      // Add engine size filter first (before search to optimize query)
      if (engineSize && engineSize !== "" && engineSize !== "other") {
        const engineSizeNum = parseInt(engineSize);
        if (!isNaN(engineSizeNum)) {
          query = query.where("engine_size", "==", engineSizeNum);
        }
      }

      // Add sorting - use correct field names
      switch (sort) {
        case "popular":
          query = query.orderBy("view_count", "desc");
          break;
        case "featured":
          query = query
            .where("is_featured", "==", true)
            .orderBy("createdAt", "desc");
          break;
        case "recent":
        default:
          query = query.orderBy("createdAt", "desc");
          break;
      }

      // For pagination, we'll get more documents and handle it in memory
      const snapshot = await query.limit(1000).get();

      let allBikes = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        allBikes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      // Apply search filter in memory
      if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        allBikes = allBikes.filter((bike) => {
          const nameMatch = bike.name?.toLowerCase().includes(searchLower);
          const brandMatch = bike.brand?.toLowerCase().includes(searchLower);
          const modelMatch = bike.model?.toLowerCase().includes(searchLower);
          return nameMatch || brandMatch || modelMatch;
        });
      }

      // Apply "other" engine size filter in memory
      if (engineSize === "other") {
        allBikes = allBikes.filter((bike) => {
          const engineSize = bike.engine_size;
          return engineSize && ![50, 125, 250].includes(engineSize);
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedBikes = allBikes.slice(startIndex, endIndex);
      const hasMore = endIndex < allBikes.length;

      return {
        bikes: paginatedBikes,
        hasMore,
        total: allBikes.length,
      };
    } catch (error) {
      console.error("Error in getAllBikes query:", error);
      throw error;
    }
  }
}

module.exports = BikeQueries;
