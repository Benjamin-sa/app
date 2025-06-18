/**
 * Bike Service
 * Handles business logic for user bike galleries
 */

const firebaseQueries = require("../../queries/FirebaseQueries");
const { deleteImage } = require("../../core/services/image.service");
const {
  createBike,
  updateBike,
  ValidationError,
  validateId,
  validatePaginationOptions,
} = require("../../utils/validation.utils");

class BikeService {
  /**
   * Get all bikes for a specific user
   */
  async getUserBikes(userId) {
    try {
      // Validate required fields
      const validatedUserId = validateId(userId, "userId");

      const bikes = await firebaseQueries.getBikesByUserId(validatedUserId);
      return bikes;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
      const validatedBikeId = validateId(bikeId, "bikeId");

      const bike = await firebaseQueries.getBikeById(validatedBikeId);

      if (!bike || !bike.id) {
        throw new Error("Bike not found");
      }

      // Increment view count if not the owner viewing
      if (requestingUserId && requestingUserId !== bike.userId) {
        await firebaseQueries.incrementBikeViews(validatedBikeId);
      }

      return bike;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      console.error("Error fetching bike:", error);
      throw new Error(`Failed to fetch bike: ${error.message}`);
    }
  }

  /**
   * Create a new bike
   */
  async createBike(userId, bikeData, images = []) {
    try {
      // Validate userId
      const validatedUserId = validateId(userId, "userId");

      // Create and validate bike using validation system
      const validatedBike = createBike({
        userId: validatedUserId,
        name: bikeData.name,
        brand: bikeData.brand,
        model: bikeData.model,
        year: bikeData.year,
        engine_size: bikeData.engine_size,
        description: bikeData.description,
        photos: images || [],
        main_image: images.length > 0 ? images[0].url : "",
      });

      // Add timestamps
      validatedBike.createdAt = new Date().toISOString();
      validatedBike.updatedAt = new Date().toISOString();

      // Create bike using firebase queries
      const docRef = await firebaseQueries.createBike(validatedBike);

      // Update user's bike count
      await this.updateUserBikeCount(validatedUserId);

      return {
        id: docRef.id,
        ...validatedBike,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
      const validatedBikeId = validateId(bikeId, "bikeId");
      const validatedUserId = validateId(userId, "userId");

      // First, verify the bike exists and belongs to the user
      const existingBike = await firebaseQueries.getBikeById(validatedBikeId);

      if (!existingBike || existingBike.isDeleted) {
        throw new Error("Bike not found");
      }

      if (existingBike.userId !== validatedUserId) {
        throw new Error("Unauthorized: You can only edit your own bikes");
      }

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

      // Use validation system to create update data
      const updateData = updateBike({
        name: bikeData.name,
        brand: bikeData.brand,
        model: bikeData.model,
        year: bikeData.year,
        engine_size: bikeData.engine_size,
        description: bikeData.description,
        photos: allPhotos,
        main_image: allPhotos.length > 0 ? allPhotos[0].url : "",
      });

      // Update bike using firebase queries
      await firebaseQueries.updateBike(validatedBikeId, updateData);

      return {
        id: validatedBikeId,
        ...existingBike,
        ...updateData,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
      const validatedBikeId = validateId(bikeId, "bikeId");
      const validatedUserId = validateId(userId, "userId");

      // First, verify the bike exists and belongs to the user
      const bike = await firebaseQueries.getBikeById(validatedBikeId);

      if (!bike) {
        throw new Error("Bike not found");
      }

      if (bike.userId !== validatedUserId) {
        throw new Error("Unauthorized: You can only delete your own bikes");
      }

      if (bike.isDeleted) {
        throw new Error("Bike already deleted");
      }
      // Soft delete the bike using firebase queries
      await firebaseQueries.deleteBike(validatedBikeId);

      // Update user's bike count
      await this.updateUserBikeCount(validatedUserId);

      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
      const validatedUserId = validateId(userId, "userId");

      // Count user's bikes using firebase queries
      const bikeCount = await firebaseQueries.countBikesByUserId(
        validatedUserId
      );

      // Update user's bike count using firebase queries
      await firebaseQueries.updateUserBikeCount(validatedUserId, bikeCount);
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error(
          "Validation error updating user bike count:",
          error.message
        );
      } else {
        console.error("Error updating user bike count:", error);
      }
      // Don't throw error here as it's not critical
    }
  }

  /**
   * Get featured bikes across all users (for homepage, etc.)
   */
  async getFeaturedBikes(limit = 10) {
    try {
      // Validate limit parameter using pagination options
      const options = validatePaginationOptions({ limit }, { maxLimit: 50 });

      const bikes = await firebaseQueries.getFeaturedBikes({
        limit: options.limit,
      });
      return bikes;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
      const validatedBikeId = validateId(bikeId, "bikeId");
      const validatedUserId = validateId(userId, "userId");

      const bike = await firebaseQueries.getBikeById(validatedBikeId);

      if (!bike) {
        throw new Error("Bike not found");
      }

      if (bike.userId !== validatedUserId) {
        throw new Error("Unauthorized: You can only modify your own bikes");
      }

      const newFeaturedStatus = !bike.is_featured;

      // Update featured status using firebase queries
      await firebaseQueries.toggleBikeFeaturedStatus(
        validatedBikeId,
        newFeaturedStatus
      );

      return newFeaturedStatus;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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

      // Validate parameters using pagination options
      const validatedOptions = validatePaginationOptions(
        { page, limit },
        { maxLimit: 50 }
      );

      const result = await firebaseQueries.getAllBikes({
        page: validatedOptions.page,
        limit: validatedOptions.limit,
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
      if (error instanceof ValidationError) {
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
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
