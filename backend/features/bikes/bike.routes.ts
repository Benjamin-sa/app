import express from "express";
import { authenticate } from "../../core/middleware/auth.middleware";
import bikeController from "./bike.controller";

// Using existing JS upload middleware until migrated
// eslint-disable-next-line @typescript-eslint/no-var-requires
const uploadMw = require("../../core/middleware/upload.middleware");

const router = express.Router();

router.get("/", bikeController.getAllBikes);
router.get("/featured", bikeController.getFeaturedBikes);
router.get("/:bikeId", bikeController.getBikeById);
router.get("/user/:userId", bikeController.getUserBikes);

router.post(
  "/",
  authenticate,
  uploadMw.uploadMultiple,
  uploadMw.handleUploadError,
  uploadMw.processImages(uploadMw.FOLDERS.BIKES || "bikes"),
  bikeController.createBike
);

router.put(
  "/:bikeId",
  authenticate,
  uploadMw.uploadMultiple,
  uploadMw.handleUploadError,
  uploadMw.processImages(uploadMw.FOLDERS.BIKES || "bikes"),
  bikeController.updateBike
);

router.delete("/:bikeId", authenticate, bikeController.deleteBike);
router.patch(
  "/:bikeId/featured",
  authenticate,
  bikeController.toggleFeaturedStatus
);

export default router;
