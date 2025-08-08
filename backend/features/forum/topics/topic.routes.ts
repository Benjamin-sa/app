import express from "express";
import {
  authenticate,
  identify,
} from "../../../core/middleware/auth.middleware";
// Reuse JS upload middleware for now
// eslint-disable-next-line @typescript-eslint/no-var-requires
const uploadMw = require("../../../core/middleware/upload.middleware");
import topicController from "./topic.controller";

const router = express.Router();

router.post(
  "/",
  authenticate,
  uploadMw.uploadMultiple,
  uploadMw.processImages(uploadMw.FOLDERS.TOPICS),
  uploadMw.handleUploadError,
  (req, res) => topicController.topicOperation(req, res, "create")
);
router.get("/", identify, topicController.getTopics);
router.get("/:id", identify, topicController.getTopicById);
router.patch(
  "/:id",
  authenticate,
  uploadMw.uploadMultiple,
  uploadMw.processImages(uploadMw.FOLDERS.TOPICS),
  uploadMw.handleUploadError,
  (req, res) => topicController.topicOperation(req, res, "update")
);
router.delete("/:id", authenticate, topicController.deleteTopic);

export default router;
module.exports = router;
