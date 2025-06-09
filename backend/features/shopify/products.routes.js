const express = require("express");
const router = express.Router();
const productsController = require("./products.controller");

// Get all products with images
router.get(
  "/with-images",
  productsController.getProductsWithImages.bind(productsController)
);

// Search products
router.get(
  "/search",
  productsController.searchProducts.bind(productsController)
);

// Get all collections
router.get(
  "/collections",
  productsController.getAllCollections.bind(productsController)
);

// Get a product list by collection
router.get(
  "/collection/:id",
  productsController.getProductsByCollection.bind(productsController)
);

// Get a product with images by ID
router.get(
  "/:id/with-images",
  productsController.getProductByIdWithImages.bind(productsController)
);

// Get product variants
router.get(
  "/:id/variants",
  productsController.getProductVariants.bind(productsController)
);

// ==================== ERROR HANDLING ====================

// Handle general errors
router.use((error, req, res, next) => {
  console.error("Products API Error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    errorSource: "products_routes",
  });
});

module.exports = router;
