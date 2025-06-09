/**
 * Bike Service
 * Handles business logic for user bike galleries
 */

const firebaseQueries = require("../queries/firebase.queries");
const { deleteImage } = require("./image.service");
const ValidationUtils = require("../utils/validation.utils");

class BikeService {
  /**
   * Get all bikes for a specific user
   */
  async getUserBikes(userId) {
    try {
      // Validate required fields
      ValidationUtils.required({ userId }, "BIKE", "get user bikes");

      const bikes = await firebaseQueries.getBikesByUserId(userId);
      return bikes;
    } catch (error) {
      console.error("Error fetching user bikes:", error);
      throw new Error(`Failed to fetch user bikes: ${error.message}`);
    }
  }

  /**
   * Get a specific bike by ID
   */
  async getBikeById(bikeId, requestingUserId = null) {
    try {
      // Validate required fields
      ValidationUtils.required({ bikeId }, "BIKE", "get bike by ID");

      const bike = await firebaseQueries.getBikeById(bikeId);

      if (!bike || !bike.id) {
        throw new Error("Bike not found");
      }

      // Increment view count if not the owner viewing
      if (requestingUserId && requestingUserId !== bike.userId) {
        await firebaseQueries.incrementBikeViews(bikeId);
      }

      return bike;
    } catch (error) {
      console.error("Error fetching bike:", error);
      throw new Error(`Failed to fetch bike: ${error.message}`);
    }
  }

  /**
   * Create a new bike
   */
  async createBike(userId, bikeData, images = []) {
    try {
      // Validate required fields
      ValidationUtils.required({ userId }, "BIKE", "create bike");
      ValidationUtils.required({ name: bikeData.name }, "BIKE", "create bike");

      // Validate bike-specific fields using centralized validation
      ValidationUtils.bikeName(bikeData.name, "BIKE");
      ValidationUtils.bikeBrand(bikeData.brand, "BIKE");
      ValidationUtils.bikeModel(bikeData.model, "BIKE");

      // Validate and parse numeric fields
      const year = ValidationUtils.bikeYear(bikeData.year, "BIKE");
      const engineSize = ValidationUtils.bikeEngineSize(
        bikeData.engine_size,
        "BIKE"
      );
      const description = ValidationUtils.bikeDescription(
        bikeData.description,
        "BIKE"
      );

      // Validate images array
      ValidationUtils.array(images, "photos", "BIKE", false, 10);

      // Prepare bike document
      const bikeDoc = {
        userId,
        name: bikeData.name.trim(),
        brand: bikeData.brand?.trim() || "",
        model: bikeData.model?.trim() || "",
        year,
        engine_size: engineSize,
        description,
        photos: images || [],
        main_image: images.length > 0 ? images[0].url : "",
        is_featured: false,
        isDeleted: false,
        view_count: 0,
        like_count: 0,
      };

      // Create bike using firebase queries
      const docRef = await firebaseQueries.createBike(bikeDoc);

      // Update user's bike count
      await this.updateUserBikeCount(userId);

      return {
        id: docRef.id,
        ...bikeDoc,
      };
    } catch (error) {
      console.error("Error creating bike:", error);
      throw new Error(`Failed to create bike: ${error.message}`);
    }
  }

  /**
   * Update an existing bike
   */
  async updateBike(
    bikeId,
    userId,
    bikeData,
    newImages = [],
    photosToDelete = []
  ) {
    try {
      // Validate required fields
      ValidationUtils.required({ bikeId, userId }, "BIKE", "update bike");

      // Validate arrays
      ValidationUtils.array(newImages, "new photos", "BIKE", false, 10);
      ValidationUtils.array(photosToDelete, "photos to delete", "BIKE", false);

      // First, verify the bike exists and belongs to the user
      const existingBike = await firebaseQueries.getBikeById(bikeId);

      if (!existingBike || existingBike.isDeleted) {
        throw new Error("Bike not found");
      }

      if (existingBike.userId !== userId) {
        throw new Error("Unauthorized: You can only edit your own bikes");
      }

      // Validate bike data if provided using centralized validation
      if (bikeData.name) {
        ValidationUtils.bikeName(bikeData.name, "BIKE");
      }
      ValidationUtils.bikeBrand(bikeData.brand, "BIKE");
      ValidationUtils.bikeModel(bikeData.model, "BIKE");

      // Parse and validate numeric fields
      const year = bikeData.year
        ? ValidationUtils.bikeYear(bikeData.year, "BIKE")
        : existingBike.year;
      const engineSize = bikeData.engine_size
        ? ValidationUtils.bikeEngineSize(bikeData.engine_size, "BIKE")
        : existingBike.engine_size;
      const description =
        bikeData.description !== undefined
          ? ValidationUtils.bikeDescription(bikeData.description, "BIKE")
          : existingBike.description;

      // Delete specified photos
      if (photosToDelete && photosToDelete.length > 0) {
        const photosToDeletePromises = photosToDelete.map(async (photoId) => {
          const photo = existingBike.photos.find((p) => p.id === photoId);
          if (photo) {
            await deleteImage(photo);
          }
        });
        await Promise.all(photosToDeletePromises);
      }

      // Filter out deleted photos
      const remainingPhotos = existingBike.photos.filter(
        (photo) => !photosToDelete.includes(photo.id)
      );

      // Combine remaining photos with new photos
      const allPhotos = [...remainingPhotos, ...newImages];

      // Validate total photo count using centralized validation
      ValidationUtils.bikePhotosLimit(remainingPhotos, newImages, "BIKE");

      // Prepare update data
      const updateData = {
        name: bikeData.name?.trim() || existingBike.name,
        brand: bikeData.brand?.trim() || existingBike.brand,
        model: bikeData.model?.trim() || existingBike.model,
        year,
        engine_size: engineSize,
        description,
        photos: allPhotos,
        main_image: allPhotos.length > 0 ? allPhotos[0].url : "",
      };

      // Update bike using firebase queries
      await firebaseQueries.updateBike(bikeId, updateData);

      return {
        id: bikeId,
        ...existingBike,
        ...updateData,
      };
    } catch (error) {
      console.error("Error updating bike:", error);
      throw new Error(`Failed to update bike: ${error.message}`);
    }
  }

  /**
   * Delete a bike (soft delete)
   */
  async deleteBike(bikeId, userId) {
    try {
      // Validate required fields
      ValidationUtils.required({ bikeId, userId }, "BIKE", "delete bike");

      // First, verify the bike exists and belongs to the user
      const bike = await firebaseQueries.getBikeById(bikeId);

      if (!bike) {
        throw new Error("Bike not found");
      }

      if (bike.userId !== userId) {
        throw new Error("Unauthorized: You can only delete your own bikes");
      }

      if (bike.isDeleted) {
        throw new Error("Bike already deleted");
      }

      // Delete all associated images
      if (bike.photos && bike.photos.length > 0) {
        const deletePromises = bike.photos.map((photo) => deleteImage(photo));
        await Promise.all(deletePromises);
      }

      // Soft delete the bike using firebase queries
      await firebaseQueries.deleteBike(bikeId);

      // Update user's bike count
      await this.updateUserBikeCount(userId);

      return true;
    } catch (error) {
      console.error("Error deleting bike:", error);
      throw new Error(`Failed to delete bike: ${error.message}`);
    }
  }

  /**
   * Update user's bike count in their profile
   */
  async updateUserBikeCount(userId) {
    try {
      // Validate required fields
      ValidationUtils.required({ userId }, "BIKE", "update user bike count");

      // Count user's bikes using firebase queries
      const bikeCount = await firebaseQueries.countBikesByUserId(userId);

      // Update user's bike count using firebase queries
      await firebaseQueries.updateUserBikeCount(userId, bikeCount);
    } catch (error) {
      console.error("Error updating user bike count:", error);
      // Don't throw error here as it's not critical
    }
  }

  /**
   * Get featured bikes across all users (for homepage, etc.)
   */
  async getFeaturedBikes(limit = 10) {
    try {
      // Validate limit parameter using centralized validation
      ValidationUtils.queryLimit(limit, "BIKE", 1, 50);

      const bikes = await firebaseQueries.getFeaturedBikes({ limit });
      return bikes;
    } catch (error) {
      console.error("Error fetching featured bikes:", error);
      throw new Error(`Failed to fetch featured bikes: ${error.message}`);
    }
  }

  /**
   * Toggle featured status of a bike (admin/user only)
   */
  async toggleFeaturedStatus(bikeId, userId) {
    try {
      // Validate required fields
      ValidationUtils.required(
        { bikeId, userId },
        "BIKE",
        "toggle featured status"
      );

      const bike = await firebaseQueries.getBikeById(bikeId);

      if (!bike) {
        throw new Error("Bike not found");
      }

      if (bike.userId !== userId) {
        throw new Error("Unauthorized: You can only modify your own bikes");
      }

      const newFeaturedStatus = !bike.is_featured;

      // Update featured status using firebase queries
      await firebaseQueries.toggleBikeFeaturedStatus(bikeId, newFeaturedStatus);

      return newFeaturedStatus;
    } catch (error) {
      console.error("Error toggling featured status:", error);
      throw new Error(`Failed to toggle featured status: ${error.message}`);
    }
  }

  /**
   * Get all bikes with pagination and filtering
   */
  async getAllBikes(options = {}) {
    try {
      const {
        page = 1,
        limit = 12,
        sort = "recent",
        search = "",
        engineSize = "",
      } = options;

      // Validate parameters
      ValidationUtils.queryLimit(limit, "BIKE", 1, 50);
      ValidationUtils.queryPage(page, "BIKE");

      const result = await firebaseQueries.getAllBikes({
        page,
        limit,
        sort,
        search,
        engineSize,
      });

      // Ensure we filter out deleted bikes (in case the query doesn't handle this)
      if (result.bikes) {
        result.bikes = result.bikes.filter((bike) => !bike.isDeleted);
      }

      return result;
    } catch (error) {
      console.error("Error fetching all bikes:", error);
      throw new Error(`Failed to fetch bikes: ${error.message}`);
    }
  }
}

const bikeService = new BikeService();

module.exports = {
  getAllBikes: bikeService.getAllBikes.bind(bikeService),
  getUserBikes: bikeService.getUserBikes.bind(bikeService),
  getBikeById: bikeService.getBikeById.bind(bikeService),
  createBike: bikeService.createBike.bind(bikeService),
  updateBike: bikeService.updateBike.bind(bikeService),
  deleteBike: bikeService.deleteBike.bind(bikeService),
  updateUserBikeCount: bikeService.updateUserBikeCount.bind(bikeService),
  getFeaturedBikes: bikeService.getFeaturedBikes.bind(bikeService),
  toggleFeaturedStatus: bikeService.toggleFeaturedStatus.bind(bikeService),
};
