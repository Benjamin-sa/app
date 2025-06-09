/**
 * Bike Routes
 * API endpoints for bike gallery functionality
 */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../../core/middleware/auth.middleware");
const {
  uploadMultiple,
  handleUploadError,
  processImages,
  FOLDERS,
} = require("../../core/middleware/upload.middleware");

const bikeController = require("./bike.controller");

// Public routes
router.get("/", bikeController.getAllBikes);
router.get("/featured", bikeController.getFeaturedBikes);
router.get("/:bikeId", bikeController.getBikeById);
router.get("/user/:userId", bikeController.getUserBikes);

// Authenticated routes with image upload
router.post(
  "/",
  authenticate,
  uploadMultiple,
  handleUploadError,
  processImages(FOLDERS.BIKES || "bikes"),
  bikeController.createBike
);

router.put(
  "/:bikeId",
  authenticate,
  uploadMultiple,
  handleUploadError,
  processImages(FOLDERS.BIKES || "bikes"),
  bikeController.updateBike
);

// Authenticated routes
router.delete("/:bikeId", authenticate, bikeController.deleteBike);
router.patch(
  "/:bikeId/featured",
  authenticate,
  bikeController.toggleFeaturedStatus
);

module.exports = router;
