import express, { Router, Request, Response, NextFunction } from "express";
import { identify } from "../../core/middleware/auth.middleware";

const router: Router = express.Router();

// Import feature routes (TS versions now available)
import userRoutes from "../auth/user.routes";
import topicRoutes from "./topics/topic.routes";
import answerRoutes from "./answers/answer.routes";
import categoryRoutes from "./categories/category.routes";
import topicController from "./topics/topic.controller";

// Mount routes with appropriate prefixes
router.use("/users", userRoutes);
router.use("/topics", topicRoutes);
router.use("/answers", answerRoutes);
router.use("/categories", categoryRoutes);

// Add search route (mounted directly since it's a special case)
router.get("/search", identify, topicController.searchTopics);

// ==================== ERROR HANDLING ====================

// Handle general errors
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Forum API Error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

export default router;
