// ...existing code...
const shopify = require("../services/shopify.service");
const cacheService = require("../services/cache.service");

class ProductsController {
  // Helper function to get a single product by ID, using cache or fetching from Shopify
  async _getAndCacheProduct(productId) {
    const cacheKey = `product:${productId}`;
    let product = await cacheService.get(cacheKey);

    if (!product) {
      product = await shopify.getProductByIdWithImages(productId);
      if (product) {
        // Cache for 15 minutes
        await cacheService.set(cacheKey, product, 900);
      }
    }
    return product;
  }

  // Get all products with images (limited)
  async getProductsWithImages(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50; // Default to 50 if not specified
      // Fetches a list of products from Shopify according to the limit
      const productsFromShopify = await shopify.getProductsWithImages(limit);

      if (productsFromShopify && productsFromShopify.length > 0) {
        // Cache each fetched product individually
        for (const product of productsFromShopify) {
          const productCacheKey = `product:${product.id}`;
          await cacheService.set(productCacheKey, product, 900); // Cache for 15 minutes
        }
        res.json(productsFromShopify);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Get products with images error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch products with images",
      });
    }
  }

  // Get a product with images by ID
  async getProductByIdWithImages(req, res) {
    try {
      const { id } = req.params;
      const product = await this._getAndCacheProduct(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: "Product not found",
        });
      }
      res.json(product);
    } catch (error) {
      console.error("Get product by ID with images error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch product with images",
      });
    }
  }

  // Get a product list by collection
  async getProductsByCollection(req, res) {
    try {
      const { id: collectionId } = req.params;
      const collectionProductIdsCacheKey = `collection:${collectionId}:productIds`;
      let productDetailsList = [];

      // 1. Try to get the list of product IDs for this collection from cache
      let productIds = await cacheService.get(collectionProductIdsCacheKey);

      if (!productIds) {
        // 2. If IDs not cached, fetch products for the collection from Shopify
        // shopify.getProductsByCollection returns fully formatted product objects
        const productsFromShopify = await shopify.getProductsByCollection(
          collectionId
        );

        if (productsFromShopify && productsFromShopify.length > 0) {
          productIds = productsFromShopify.map((p) => p.id);
          // Cache the list of product IDs
          await cacheService.set(collectionProductIdsCacheKey, productIds, 900); // Cache for 15 mins

          // Cache each product individually as we have the full data
          for (const product of productsFromShopify) {
            await cacheService.set(`product:${product.id}`, product, 900); // Cache for 15 mins
          }
          // We have the full product details, so we can use them directly
          productDetailsList = productsFromShopify;
        } else {
          productIds = [];
          // Cache empty list of IDs to prevent repeated Shopify calls for non-existent/empty collections
          await cacheService.set(collectionProductIdsCacheKey, [], 900);
        }
      }

      // 3. If productDetailsList isn't populated yet (i.e., IDs came from cache), fetch each product
      if (
        productDetailsList.length === 0 &&
        productIds &&
        productIds.length > 0
      ) {
        for (const productId of productIds) {
          const product = await this._getAndCacheProduct(productId); // Uses individual cache
          if (product) {
            productDetailsList.push(product);
          }
        }
      }

      res.json(productDetailsList);
    } catch (error) {
      console.error(
        `Get products by collection (ID: ${req.params.id}) error:`,
        error
      );
      res.status(500).json({
        success: false,
        error: "Failed to fetch products by collection",
      });
    }
  }

  // Get all collections
  async getAllCollections(req, res) {
    try {
      const cacheKey = "collections:all";
      let collections = await cacheService.get(cacheKey);

      if (!collections) {
        if (typeof shopify.getAllCollections === "function") {
          collections = await shopify.getAllCollections();
          if (collections) {
            await cacheService.set(cacheKey, collections, 1800); // Cache for 30 minutes
          }
        } else {
          return res.status(501).json({
            success: false,
            error: "Collections endpoint not implemented",
          });
        }
      }
      res.json({
        success: true,
        data: collections,
      });
    } catch (error) {
      console.error("Get all collections error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch collections",
      });
    }
  }

  // Search products
  async searchProducts(req, res) {
    try {
      const { q: searchTerm, limit = 50 } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Search term must be at least 2 characters",
        });
      }

      // For search, we'll use a strategy where we fetch a broad set of products
      // if a dedicated search cache is cold. This is a compromise for in-memory search.
      const searchProductSetCacheKey = "search:allProductsSet";
      let productsToSearch = await cacheService.get(searchProductSetCacheKey);

      if (!productsToSearch) {
        console.log("Search cache miss. Fetching products for search index...");
        // Fetch a larger set of products for searching (e.g., Shopify's max per query or a reasonable number)
        // This assumes getProductsWithImages can fetch a general list.
        productsToSearch = await shopify.getProductsWithImages(200); // Fetch up to 200
        if (productsToSearch && productsToSearch.length > 0) {
          // Cache these products individually as well
          for (const product of productsToSearch) {
            await cacheService.set(`product:${product.id}`, product, 900);
          }
          // Cache the set of products used for searching
          await cacheService.set(
            searchProductSetCacheKey,
            productsToSearch,
            900
          ); // Cache for 15 mins
        } else {
          productsToSearch = [];
        }
      }

      const term = searchTerm.trim().toLowerCase();
      const limitNum = parseInt(limit);

      const searchResults = productsToSearch
        .filter((product) => {
          return (
            product.title?.toLowerCase().includes(term) ||
            product.description?.toLowerCase().includes(term) ||
            (Array.isArray(product.tags) &&
              product.tags.some(
                (tag) =>
                  typeof tag === "string" && tag.toLowerCase().includes(term)
              )) ||
            (typeof product.tags === "string" &&
              product.tags.toLowerCase().includes(term)) // Handle if tags is a string
          );
        })
        .slice(0, limitNum);

      res.json({
        success: true,
        data: searchResults,
      });
    } catch (error) {
      console.error("Search products error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search products",
      });
    }
  }

  // Get product variants
  async getProductVariants(req, res) {
    try {
      const { id } = req.params;
      const cacheKey = `product:${id}:variants`;
      let variants = await cacheService.get(cacheKey);

      if (!variants) {
        if (typeof shopify.getProductVariants === "function") {
          variants = await shopify.getProductVariants(id);
          if (variants) {
            await cacheService.set(cacheKey, variants, 900); // Cache for 15 minutes
          }
        } else {
          // If shopify.getProductVariants is not a function, try to get variants from the full product
          const productData = await this._getAndCacheProduct(id);
          if (productData && productData.variants) {
            // Assuming variants are part of the main product data
            variants = productData.variants;
            // No need to cache separately if they are part of the main product object,
            // but if shopify.getProductVariants exists, it implies a separate, more detailed fetch.
            // For consistency with the original logic, we'll cache if fetched specifically.
            // However, the original code only caches if shopify.getProductVariants exists.
            // Let's stick to that: only cache if shopify.getProductVariants was called.
          } else {
            return res.status(501).json({
              success: false,
              error:
                "Product variants endpoint not implemented or product has no variants",
            });
          }
        }
      }

      if (!variants) {
        // If variants are still not found (e.g. product has no variants from _getAndCacheProduct)
        return res.status(404).json({
          success: false,
          error: "Product variants not found",
        });
      }

      res.json({
        success: true,
        data: variants,
      });
    } catch (error) {
      console.error("Get product variants error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch product variants",
      });
    }
  }

  // Clear cache (admin function)
  async clearProductCache(req, res) {
    try {
      // Clear known aggregate/list caches
      await cacheService.delete("collections:all");
      await cacheService.delete("search:allProductsSet");
      // Add other specific top-level cache keys if any (e.g., collection:ID:productIds)
      // Deleting individual product caches (product:ID) or collection-specific product ID lists
      // without pattern support in cacheService would require iterating known IDs, which is complex.
      // Individual items will expire based on their TTL.

      res.json({
        success: true,
        message:
          "Cleared aggregate caches (all_collections, search_product_set). Individual item caches rely on TTL.",
      });
    } catch (error) {
      console.error("Clear product cache error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear product cache",
      });
    }
  }
}

module.exports = new ProductsController();
