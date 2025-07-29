const express = require("express");
const categoryController = require("./category.controller");
const { authenticate } = require("../../../core/middleware/auth.middleware");

const router = express.Router();

// Public routes
router.get("/", categoryController.getCategories);
router.get("/:categoryId/stats", categoryController.getCategoryStats);

// Admin routes (could add admin middleware here)
router.post("/refresh-stats", authenticate, categoryController.refreshStats);

module.exports = router;
