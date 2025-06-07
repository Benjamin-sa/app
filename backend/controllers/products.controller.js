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
        res.json({
          success: true,
          data: productsFromShopify,
        });
      } else {
        res.json({
          success: true,
          data: [],
        });
      }
    } catch (error) {
      console.error(
        "PRODUCTS_CONTROLLER_ERROR: Get Products With Images Error:",
        error
      );

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `PRODUCTS_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "products_controller",
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
          error: "PRODUCTS_CONTROLLER_ERROR: Product not found",
          errorSource: "products_controller",
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error(
        "PRODUCTS_CONTROLLER_ERROR: Get Product By ID With Images Error:",
        error
      );

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `PRODUCTS_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "products_controller",
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

      res.json({
        success: true,
        data: productDetailsList,
      });
    } catch (error) {
      console.error(
        `PRODUCTS_CONTROLLER_ERROR: Get Products By Collection (ID: ${req.params.id}) Error:`,
        error
      );

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `PRODUCTS_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "products_controller",
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
            error:
              "PRODUCTS_CONTROLLER_ERROR: Collections endpoint not implemented",
            errorSource: "products_controller",
          });
        }
      }
      res.json({
        success: true,
        data: collections,
      });
    } catch (error) {
      console.error(
        "PRODUCTS_CONTROLLER_ERROR: Get All Collections Error:",
        error
      );

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `PRODUCTS_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "products_controller",
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
          error:
            "PRODUCTS_CONTROLLER_VALIDATION_ERROR: Search term must be at least 2 characters",
          errorSource: "products_controller",
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
      console.error("PRODUCTS_CONTROLLER_ERROR: Search Products Error:", error);

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `PRODUCTS_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "products_controller",
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
                "PRODUCTS_CONTROLLER_ERROR: Product variants endpoint not implemented or product has no variants",
              errorSource: "products_controller",
            });
          }
        }
      }

      if (!variants) {
        // If variants are still not found (e.g. product has no variants from _getAndCacheProduct)
        return res.status(404).json({
          success: false,
          error:
            "PRODUCTS_CONTROLLER_NOT_FOUND_ERROR: Product variants not found",
          errorSource: "products_controller",
        });
      }

      res.json({
        success: true,
        data: variants,
      });
    } catch (error) {
      console.error(
        "PRODUCTS_CONTROLLER_ERROR: Get Product Variants Error:",
        error
      );

      let statusCode = 500;
      if (error.message.includes("VALIDATION_ERROR")) {
        statusCode = 400;
      } else if (error.message.includes("NOT_FOUND_ERROR")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: `PRODUCTS_CONTROLLER_ERROR: ${error.message}`,
        errorSource: "products_controller",
      });
    }
  }
}

module.exports = new ProductsController();
