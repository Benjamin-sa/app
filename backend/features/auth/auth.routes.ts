import express from "express";
import { authenticate } from "../../core/middleware/auth.middleware";
import authController from "./auth.controller";
import {
  uploadMultiple,
  processImages,
  handleUploadError,
  FOLDERS,
} from "../../core/middleware/upload.middleware";

const router = express.Router();

router.get("/me", authenticate, authController.getMe);
router.put(
  "/profile",
  authenticate,
  uploadMultiple,
  processImages(FOLDERS.AVATARS),
  handleUploadError,
  authController.updateProfile
);
router.post("/sync", authenticate, authController.syncUser);

export default router;
