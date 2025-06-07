const express = require("express");
const router = express.Router();
const { productsController } = require("../controllers");

// Get all products with images
router.get(
  "/with-images",
  productsController.getProductsWithImages.bind(productsController)
);

// Get a product with images by ID
router.get(
  "/:id/with-images",
  productsController.getProductByIdWithImages.bind(productsController)
);

// Get a product list by collection
router.get(
  "/collection/:id",
  productsController.getProductsByCollection.bind(productsController)
);

router.get(
  "/collections",
  productsController.getAllCollections.bind(productsController)
);

module.exports = router;
