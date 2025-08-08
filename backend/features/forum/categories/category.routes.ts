import express from "express";
import { authenticate } from "../../../core/middleware/auth.middleware";
import categoryController from "./category.controller";

const router = express.Router();

router.get("/", categoryController.getCategories);
router.get("/:categoryId/stats", categoryController.getCategoryStats);
router.post("/refresh-stats", authenticate, categoryController.refreshStats);

export default router;
module.exports = router;
