/**
 * Bike Routes
 * API endpoints for bike gallery functionality
 */

const express = require("express");
const router = express.Router();

// Import middleware
const { authenticate } = require("../middleware/auth.middleware");
const {
  uploadMultiple,
  handleUploadError,
  processImages,
  FOLDERS,
} = require("../middleware/upload.middleware");

// Import controller
const bikeController = require("../controllers/bike.controller");

// Public routes (no auth required)
router.get("/", bikeController.getAllBikes);
router.get("/featured", bikeController.getFeaturedBikes);
router.get("/:bikeId", bikeController.getBikeById);

// User-specific bike routes (public viewing)
router.get("/user/:userId", bikeController.getUserBikes);

// Create bike with images
router.post(
  "/",
  authenticate,
  uploadMultiple,
  handleUploadError,
  processImages(FOLDERS.BIKES || "bikes"),
  bikeController.createBike
);

// Update bike with images
router.put(
  "/:bikeId",
  authenticate,
  uploadMultiple,
  handleUploadError,
  processImages(FOLDERS.BIKES || "bikes"),
  bikeController.updateBike
);

// Delete bike
router.delete("/:bikeId", authenticate, bikeController.deleteBike);

// Toggle featured status
router.patch(
  "/:bikeId/featured",
  authenticate,
  bikeController.toggleFeaturedStatus
);

module.exports = router;
