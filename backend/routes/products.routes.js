const express = require("express");
const router = express.Router();
const shopify = require("../services/shopify.service");

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

//Get a product list by collection
router.get("/collection/:id", async (req, res) => {
  try {
    const products = await shopify.getProductsByCollection(req.params.id);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products by collection" });
  }
});

module.exports = router;
