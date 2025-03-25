const express = require("express");
const router = express.Router();
const shopify = require("../services/shopify");

// Get all products with images
router.get("/with-images", async (req, res) => {
  try {
    const limit = req.query.limit || 200;
    const products = await shopify.getProductsWithImages(limit);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products with images" });
  }
});

// Get a product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await shopify.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Get a product with images by ID
router.get("/:id/with-images", async (req, res) => {
  try {
    const product = await shopify.getProductByIdWithImages(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product with images" });
  }
});

module.exports = router;
