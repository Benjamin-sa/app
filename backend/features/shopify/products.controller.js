const BaseController = require("../../core/controller/base.controller");
const shopify = require("./shopify.service");

class ProductsController extends BaseController {
  constructor() {
    super("PRODUCTS");
  }
  // Helper function to get a single product by ID, using cache or fetching from Shopify
  async _getAndCacheProduct(productId) {
    const cacheKey = `product:${productId}`;
    return this.getCachedData(
      cacheKey,
      () => shopify.getProductByIdWithImages(productId),
      900
    );
  }

  // Get all products with images (limited)
  async getProductsWithImages(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const productsFromShopify = await shopify.getProductsWithImages(limit);

      if (productsFromShopify && productsFromShopify.length > 0) {
        // Cache each fetched product individually
        for (const product of productsFromShopify) {
          const productCacheKey = `product:${product.id}`;
          await this.getCachedData(productCacheKey, () => product, 900);
        }
        return this.sendSuccess(res, productsFromShopify);
      } else {
        return this.sendSuccess(res, []);
      }
    } catch (error) {
      this.handleError(res, error, "Get Products With Images");
    }
  }

  // Get a product with images by ID
  async getProductByIdWithImages(req, res) {
    try {
      const { id } = req.params;
      const product = await this._getAndCacheProduct(id);

      if (!product) {
        const error = new Error("NOT_FOUND_ERROR: Product not found");
        return this.handleError(res, error, "Get Product By ID");
      }

      return this.sendSuccess(res, product);
    } catch (error) {
      this.handleError(res, error, "Get Product By ID With Images");
    }
  }

  // Get a product list by collection
  async getProductsByCollection(req, res) {
    try {
      const { id: collectionId } = req.params;
      const collectionProductIdsCacheKey = `collection:${collectionId}:productIds`;
      let productDetailsList = [];

      // 1. Try to get the list of product IDs for this collection from cache
      let productIds = await this.getCachedData(
        collectionProductIdsCacheKey,
        async () => {
          const productsFromShopify = await shopify.getProductsByCollection(
            collectionId
          );
          if (productsFromShopify && productsFromShopify.length > 0) {
            productDetailsList = productsFromShopify;
            return productsFromShopify.map((p) => p.id);
          }
          return [];
        },
        900
      );

      // 3. If productDetailsList isn't populated yet (i.e., IDs came from cache), fetch each product
      if (
        productDetailsList.length === 0 &&
        productIds &&
        productIds.length > 0
      ) {
        for (const productId of productIds) {
          const product = await this._getAndCacheProduct(productId);
          if (product) {
            productDetailsList.push(product);
          }
        }
      }

      return this.sendSuccess(res, productDetailsList);
    } catch (error) {
      this.handleError(
        res,
        error,
        `Get Products By Collection (ID: ${req.params.id})`
      );
    }
  }

  // Get all collections
  async getAllCollections(req, res) {
    try {
      if (typeof shopify.getAllCollections !== "function") {
        const error = new Error("Collections endpoint not implemented");
        return res.status(501).json({
          success: false,
          error: `${this.controllerName}_CONTROLLER_ERROR: ${error.message}`,
          errorSource: `${this.controllerName.toLowerCase()}_controller`,
        });
      }

      const collections = await this.getCachedData(
        "collections:all",
        () => shopify.getAllCollections(),
        1800 // Cache for 30 minutes
      );

      return this.sendSuccess(res, collections);
    } catch (error) {
      this.handleError(res, error, "Get All Collections");
    }
  }

  // Search products
  async searchProducts(req, res) {
    try {
      const { q: searchTerm, limit = 50 } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        const error = new Error(
          "VALIDATION_ERROR: Search term must be at least 2 characters"
        );
        return this.handleError(res, error, "Search Products");
      }

      const productsToSearch = await this.getCachedData(
        "search:allProductsSet",
        () => shopify.getProductsWithImages(200),
        900 // Cache for 15 mins
      );

      const term = searchTerm.trim().toLowerCase();
      const limitNum = parseInt(limit);

      const searchResults = (productsToSearch || [])
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
              product.tags.toLowerCase().includes(term))
          );
        })
        .slice(0, limitNum);

      return this.sendSuccess(res, searchResults);
    } catch (error) {
      this.handleError(res, error, "Search Products");
    }
  }

  // Get product variants
  async getProductVariants(req, res) {
    try {
      const { id } = req.params;

      let variants = await this.getCachedData(
        `product:${id}:variants`,
        async () => {
          if (typeof shopify.getProductVariants === "function") {
            return await shopify.getProductVariants(id);
          } else {
            const productData = await this._getAndCacheProduct(id);
            return productData?.variants || null;
          }
        },
        900
      );

      if (!variants) {
        const error = new Error("NOT_FOUND_ERROR: Product variants not found");
        return this.handleError(res, error, "Get Product Variants");
      }

      return this.sendSuccess(res, variants);
    } catch (error) {
      this.handleError(res, error, "Get Product Variants");
    }
  }
}

module.exports = new ProductsController();
