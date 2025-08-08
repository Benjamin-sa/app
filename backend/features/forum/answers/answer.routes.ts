import express from "express";
import {
  authenticate,
  identify,
} from "../../../core/middleware/auth.middleware";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const uploadMw = require("../../../core/middleware/upload.middleware");
import answerController from "./answer.controller";

const router = express.Router();

router.post(
  "/:topicId",
  authenticate,
  uploadMw.uploadMultiple,
  uploadMw.processImages(uploadMw.FOLDERS.ANSWERS),
  uploadMw.handleUploadError,
  answerController.createAnswer
);
router.patch(
  "/:answerId",
  authenticate,
  uploadMw.uploadMultiple,
  uploadMw.processImages(uploadMw.FOLDERS.ANSWERS),
  uploadMw.handleUploadError,
  answerController.updateAnswer
);
router.delete("/:id", authenticate, answerController.deleteAnswer);
router.get("/:topicId", identify, answerController.getAnswersByTopic);

export default router;
module.exports = router;
