/**
 * Bike Controller
 * Handles HTTP requests for bike gallery functionality
 */

const bikeService = require("../services/bike.service");

/**
 * GET /users/:userId/bikes
 * Get all bikes for a specific user
 */
const getUserBikes = async (req, res) => {
  try {
    const { userId } = req.params;

    const bikes = await bikeService.getUserBikes(userId);

    res.json({
      success: true,
      bikes,
      count: bikes.length,
    });
  } catch (error) {
    console.error("Error in getUserBikes:", error);
    res.status(400).json({
      success: false,
      error: "Failed to fetch user bikes",
      message: error.message,
    });
  }
};

/**
 * GET /bikes/:bikeId
 * Get a specific bike by ID
 */
const getBikeById = async (req, res) => {
  try {
    const { bikeId } = req.params;
    const requestingUserId = req.user?.uid; // From auth middleware

    const bike = await bikeService.getBikeById(bikeId, requestingUserId);

    res.json({
      success: true,
      bike,
    });
  } catch (error) {
    console.error("Error in getBikeById:", error);
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: "Failed to fetch bike",
      message: error.message,
    });
  }
};

/**
 * POST /users/bikes
 * Create a new bike
 */
const createBike = async (req, res) => {
  try {
    const userId = req.user.uid; // From auth middleware
    const bikeData = req.body;
    const images = req.imageData || []; // From processImages middleware

    console.log("Creating bike with data:", bikeData);
    console.log("Images processed:", images.length);

    const bike = await bikeService.createBike(userId, bikeData, images);

    res.status(201).json({
      success: true,
      message: "Bike created successfully",
      bike,
    });
  } catch (error) {
    console.error("Error in createBike:", error);
    res.status(400).json({
      success: false,
      error: "Failed to create bike",
      message: error.message,
    });
  }
};

/**
 * PUT /users/bikes/:bikeId
 * Update an existing bike
 */
const updateBike = async (req, res) => {
  try {
    const { bikeId } = req.params;
    const userId = req.user.uid; // From auth middleware
    const bikeData = req.body;
    const newImages = req.imageData || []; // From processImages middleware

    // Parse photos to delete (if provided as JSON string)
    let photosToDelete = [];
    if (req.body.photos_to_delete) {
      try {
        photosToDelete = JSON.parse(req.body.photos_to_delete);
      } catch (parseError) {
        console.warn("Failed to parse photos_to_delete:", parseError);
      }
    }

    console.log("Updating bike:", bikeId);
    console.log("New images:", newImages.length);
    console.log("Photos to delete:", photosToDelete.length);

    const bike = await bikeService.updateBike(
      bikeId,
      userId,
      bikeData,
      newImages,
      photosToDelete
    );

    res.json({
      success: true,
      message: "Bike updated successfully",
      bike,
    });
  } catch (error) {
    console.error("Error in updateBike:", error);
    const statusCode = error.message.includes("Unauthorized")
      ? 403
      : error.message.includes("not found")
      ? 404
      : 400;
    res.status(statusCode).json({
      success: false,
      error: "Failed to update bike",
      message: error.message,
    });
  }
};

/**
 * DELETE /users/bikes/:bikeId
 * Delete a bike
 */
const deleteBike = async (req, res) => {
  try {
    const { bikeId } = req.params;
    const userId = req.user.uid; // From auth middleware

    await bikeService.deleteBike(bikeId, userId);

    res.json({
      success: true,
      message: "Bike deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteBike:", error);
    const statusCode = error.message.includes("Unauthorized")
      ? 403
      : error.message.includes("not found")
      ? 404
      : 400;
    res.status(statusCode).json({
      success: false,
      error: "Failed to delete bike",
      message: error.message,
    });
  }
};

/**
 * GET /bikes/featured
 * Get featured bikes across all users
 */
const getFeaturedBikes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const bikes = await bikeService.getFeaturedBikes(limit);

    res.json({
      success: true,
      bikes,
      count: bikes.length,
    });
  } catch (error) {
    console.error("Error in getFeaturedBikes:", error);
    res.status(400).json({
      success: false,
      error: "Failed to fetch featured bikes",
      message: error.message,
    });
  }
};

/**
 * PATCH /users/bikes/:bikeId/featured
 * Toggle featured status of a bike
 */
const toggleFeaturedStatus = async (req, res) => {
  try {
    const { bikeId } = req.params;
    const userId = req.user.uid; // From auth middleware

    const isFeatured = await bikeService.toggleFeaturedStatus(bikeId, userId);

    res.json({
      success: true,
      message: `Bike ${isFeatured ? "featured" : "unfeatured"} successfully`,
      is_featured: isFeatured,
    });
  } catch (error) {
    console.error("Error in toggleFeaturedStatus:", error);
    const statusCode = error.message.includes("Unauthorized")
      ? 403
      : error.message.includes("not found")
      ? 404
      : 400;
    res.status(statusCode).json({
      success: false,
      error: "Failed to toggle featured status",
      message: error.message,
    });
  }
};

/**
 * GET /bikes
 * Get all bikes with pagination and filtering
 */
const getAllBikes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const sort = req.query.sort || "recent";
    const search = req.query.search || "";
    const engineSize = req.query.engine_size || "";

    const result = await bikeService.getAllBikes({
      page,
      limit,
      sort,
      search,
      engineSize,
    });

    res.json({
      success: true,
      bikes: result.bikes,
      hasMore: result.hasMore,
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error in getAllBikes:", error);
    res.status(400).json({
      success: false,
      error: "Failed to fetch bikes",
      message: error.message,
    });
  }
};

module.exports = {
  getAllBikes,
  getUserBikes,
  getBikeById,
  createBike,
  updateBike,
  deleteBike,
  getFeaturedBikes,
  toggleFeaturedStatus,
};
