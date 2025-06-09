/**
 * Bike Controller
 * Handles HTTP requests for bike gallery functionality
 */

const BaseController = require("../../core/controller/base.controller");
const bikeService = require("./bike.service");

class BikeController extends BaseController {
  constructor() {
    super("bike");
  }

  // GET /users/:userId/bikes - Get user's bikes
  async getUserBikes(req, res) {
    try {
      const { userId } = req.params;
      const bikes = await bikeService.getUserBikes(userId);

      this.sendSuccess(res, {
        bikes,
        count: bikes.length,
      });
    } catch (error) {
      this.handleError(res, error, "get user bikes");
    }
  }

  // GET /bikes/:bikeId - Get bike by ID
  async getBikeById(req, res) {
    try {
      const { bikeId } = req.params;
      const requestingUserId = req.user?.uid;

      const bike = await bikeService.getBikeById(bikeId, requestingUserId);
      this.sendSuccess(res, { bike });
    } catch (error) {
      this.handleError(res, error, "get bike by ID");
    }
  }

  // POST /users/bikes - Create new bike with images
  async createBike(req, res) {
    try {
      const userId = req.user.uid;
      const bikeData = req.body;
      const images = req.imageData || [];

      console.log("Creating bike with data:", bikeData);
      console.log("Images processed:", images.length);

      const bike = await bikeService.createBike(userId, bikeData, images);

      // Invalidate related caches
      await this.invalidateCache("bikes:*");
      await this.invalidateCache("featured_bikes:*");

      this.sendSuccess(res, { bike }, 201, "Bike created successfully");
    } catch (error) {
      this.handleError(res, error, "create bike");
    }
  }

  // PUT /users/bikes/:bikeId - Update bike with images
  async updateBike(req, res) {
    try {
      const { bikeId } = req.params;
      const userId = req.user.uid;
      const bikeData = req.body;
      const newImages = req.imageData || [];

      // Parse photos to delete
      let photosToDelete = [];
      if (req.body.photos_to_delete) {
        try {
          photosToDelete = JSON.parse(req.body.photos_to_delete);
        } catch (parseError) {
          console.warn("Failed to parse photos_to_delete:", parseError);
        }
      }

      const bike = await bikeService.updateBike(
        bikeId,
        userId,
        bikeData,
        newImages,
        photosToDelete
      );

      // Invalidate caches
      await this.invalidateCache("bikes:*");
      await this.invalidateCache("featured_bikes:*");
      await this.deleteCache(`bike:${bikeId}`);

      this.sendSuccess(res, { bike }, 200, "Bike updated successfully");
    } catch (error) {
      this.handleError(res, error, "update bike");
    }
  }

  // DELETE /users/bikes/:bikeId - Delete bike
  async deleteBike(req, res) {
    try {
      const { bikeId } = req.params;
      const userId = req.user.uid;

      await bikeService.deleteBike(bikeId, userId);

      // Invalidate caches
      await this.invalidateCache("bikes:*");
      await this.invalidateCache("featured_bikes:*");
      await this.deleteCache(`bike:${bikeId}`);

      this.sendSuccess(res, null, 200, "Bike deleted successfully");
    } catch (error) {
      this.handleError(res, error, "delete bike");
    }
  }

  // GET /bikes/featured - Get featured bikes with caching
  async getFeaturedBikes(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const cacheKey = `featured_bikes:${limit}`;

      const bikes = await this.getCachedData(
        cacheKey,
        () => bikeService.getFeaturedBikes(limit),
        600 // 10 minutes cache
      );

      this.sendSuccess(res, {
        bikes,
        count: bikes.length,
      });
    } catch (error) {
      this.handleError(res, error, "get featured bikes");
    }
  }

  // PATCH /users/bikes/:bikeId/featured - Toggle featured status
  async toggleFeaturedStatus(req, res) {
    try {
      const { bikeId } = req.params;
      const userId = req.user.uid;

      const isFeatured = await bikeService.toggleFeaturedStatus(bikeId, userId);

      // Invalidate featured bikes cache
      await this.invalidateCache("featured_bikes:*");
      await this.deleteCache(`bike:${bikeId}`);

      this.sendSuccess(
        res,
        { is_featured: isFeatured },
        200,
        `Bike ${isFeatured ? "featured" : "unfeatured"} successfully`
      );
    } catch (error) {
      this.handleError(res, error, "toggle featured status");
    }
  }

  // GET /bikes - Get all bikes with pagination, filtering, and caching
  async getAllBikes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 12, 50);
      const sort = req.query.sort || "recent";
      const search = req.query.search || "";
      const engineSize = req.query.engine_size || "";

      const cacheKey = `bikes:${page}:${limit}:${sort}:${search}:${engineSize}`;

      const result = await this.getCachedData(
        cacheKey,
        () =>
          bikeService.getAllBikes({
            page,
            limit,
            sort,
            search,
            engineSize,
          }),
        300 // 5 minutes cache
      );

      this.sendSuccess(res, {
        bikes: result.bikes,
        hasMore: result.hasMore,
        total: result.total,
        page,
        limit,
      });
    } catch (error) {
      this.handleError(res, error, "get all bikes");
    }
  }
}

// Create instance and export methods
const bikeController = new BikeController();

module.exports = {
  getAllBikes: bikeController.getAllBikes,
  getUserBikes: bikeController.getUserBikes,
  getBikeById: bikeController.getBikeById,
  createBike: bikeController.createBike,
  updateBike: bikeController.updateBike,
  deleteBike: bikeController.deleteBike,
  getFeaturedBikes: bikeController.getFeaturedBikes,
  toggleFeaturedStatus: bikeController.toggleFeaturedStatus,
};
