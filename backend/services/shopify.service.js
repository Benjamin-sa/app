const axios = require("axios");
const config = require("../config/shopify");
const queries = require("../queries/shopifyQueries");

// Helper function to execute Shopify GraphQL queries
async function _executeShopifyQuery(query) {
  try {
    const response = await axios({
      url: config.url,
      method: "POST",
      headers: config.headers,
      data: { query },
    });

    if (response.data.errors) {
      throw new Error(
        `SHOPIFY_SERVICE_ERROR: GraphQL errors - ${response.data.errors
          .map((err) => err.message)
          .join(", ")}`
      );
    }

    return response.data;
  } catch (error) {
    if (error.message.includes("SHOPIFY_SERVICE_ERROR:")) {
      throw error;
    }

    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Unable to connect to Shopify API"
      );
    }

    if (error.response?.status === 401) {
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Unauthorized - Invalid Shopify credentials"
      );
    }

    if (error.response?.status === 429) {
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Rate limit exceeded - Too many requests"
      );
    }

    throw new Error(
      `SHOPIFY_SERVICE_ERROR: Failed to execute GraphQL query - ${error.message}`
    );
  }
}

// Helper function to format product data
function _formatProduct(
  product,
  includeImages = false,
  includeCollections = false
) {
  const formattedProduct = {
    id: product.id.split("/").pop(),
    title: product.title,
    handle: product.handle,
    description: product.description,
    price: product.variants.edges[0]?.node.price || "0.00",
  };

  if (includeImages && product.images) {
    formattedProduct.images = product.images.edges.map((img) => ({
      id: img.node.id.split("/").pop(),
      src: img.node.url,
      alt: img.node.altText || product.title,
    }));
  }

  if (includeCollections && product.collections) {
    formattedProduct.collections =
      product.collections.edges.map((col) => ({
        id: col.node.id.split("/").pop(),
        title: col.node.title,
        handle: col.node.handle,
      })) || [];
  }

  return formattedProduct;
}

async function getProductsByCollection(collectionHandle) {
  try {
    if (!collectionHandle || typeof collectionHandle !== "string") {
      throw new Error(
        "SHOPIFY_SERVICE_VALIDATION_ERROR: Collection handle is required and must be a string"
      );
    }

    const query = queries.GET_PRODUCTS_BY_COLLECTION(collectionHandle);
    const data = await _executeShopifyQuery(query);

    if (!data.data?.collectionByHandle) {
      throw new Error(
        `SHOPIFY_SERVICE_NOT_FOUND_ERROR: Collection '${collectionHandle}' not found`
      );
    }

    return data.data.collectionByHandle.products.edges.map((edge) =>
      _formatProduct(edge.node, true, true)
    );
  } catch (error) {
    if (error.message.includes("SHOPIFY_SERVICE_")) {
      throw error;
    }
    throw new Error(
      `SHOPIFY_SERVICE_ERROR: Failed to fetch products from collection '${collectionHandle}' - ${error.message}`
    );
  }
}

async function getAllCollections() {
  try {
    const query = queries.GET_ALL_COLLECTIONS();
    const data = await _executeShopifyQuery(query);

    if (!data.data?.collections) {
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Invalid response structure for collections"
      );
    }

    return data.data.collections.edges.map((edge) => ({
      id: edge.node.id.split("/").pop(),
      title: edge.node.title,
      handle: edge.node.handle,
      description: edge.node.description || "",
    }));
  } catch (error) {
    if (error.message.includes("SHOPIFY_SERVICE_")) {
      throw error;
    }
    throw new Error(
      `SHOPIFY_SERVICE_ERROR: Failed to fetch collections - ${error.message}`
    );
  }
}

// Get products with images
async function getProductsWithImages(limit = 200) {
  try {
    if (limit && (typeof limit !== "number" || limit < 1 || limit > 250)) {
      throw new Error(
        "SHOPIFY_SERVICE_VALIDATION_ERROR: Limit must be a number between 1 and 250"
      );
    }

    const query = queries.GET_PRODUCTS_WITH_IMAGES(limit);
    const data = await _executeShopifyQuery(query);

    if (!data.data?.products) {
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Invalid response structure for products"
      );
    }

    return data.data.products.edges.map((edge) =>
      _formatProduct(edge.node, true, true)
    );
  } catch (error) {
    if (error.message.includes("SHOPIFY_SERVICE_")) {
      throw error;
    }
    throw new Error(
      `SHOPIFY_SERVICE_ERROR: Failed to fetch products with images - ${error.message}`
    );
  }
}

// Get a single product with images by ID
async function getProductByIdWithImages(productId) {
  try {
    if (!productId) {
      throw new Error(
        "SHOPIFY_SERVICE_VALIDATION_ERROR: Product ID is required"
      );
    }

    const query = queries.GET_PRODUCT_BY_ID_WITH_IMAGES(productId);
    const data = await _executeShopifyQuery(query);

    if (!data.data) {
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Invalid response structure for product"
      );
    }

    const product = data.data.product;
    if (!product) {
      throw new Error(
        `SHOPIFY_SERVICE_NOT_FOUND_ERROR: Product with ID '${productId}' not found`
      );
    }

    return _formatProduct(product, true, true);
  } catch (error) {
    if (error.message.includes("SHOPIFY_SERVICE_")) {
      throw error;
    }
    throw new Error(
      `SHOPIFY_SERVICE_ERROR: Failed to fetch product '${productId}' with images - ${error.message}`
    );
  }
}

// Get product variants by product ID
async function getProductVariants(productId) {
  try {
    if (!productId) {
      throw new Error(
        "SHOPIFY_SERVICE_VALIDATION_ERROR: Product ID is required"
      );
    }

    // Since we don't have a specific query for variants, we'll get the full product
    // and extract the variants. This could be optimized with a dedicated GraphQL query.
    const query = queries.GET_PRODUCT_BY_ID_WITH_IMAGES(productId);
    const data = await _executeShopifyQuery(query);

    if (!data.data) {
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Invalid response structure for product variants"
      );
    }

    const product = data.data.product;
    if (!product) {
      throw new Error(
        `SHOPIFY_SERVICE_NOT_FOUND_ERROR: Product with ID '${productId}' not found`
      );
    }

    if (!product.variants || !product.variants.edges) {
      throw new Error(
        `SHOPIFY_SERVICE_NOT_FOUND_ERROR: No variants found for product '${productId}'`
      );
    }

    return product.variants.edges.map((edge) => ({
      id: edge.node.id.split("/").pop(),
      title: edge.node.title,
      price: edge.node.price,
      compareAtPrice: edge.node.compareAtPrice,
      sku: edge.node.sku,
      barcode: edge.node.barcode,
      availableForSale: edge.node.availableForSale,
      quantityAvailable: edge.node.quantityAvailable,
      weight: edge.node.weight,
      weightUnit: edge.node.weightUnit,
      selectedOptions: edge.node.selectedOptions || [],
    }));
  } catch (error) {
    if (error.message.includes("SHOPIFY_SERVICE_")) {
      throw error;
    }
    throw new Error(
      `SHOPIFY_SERVICE_ERROR: Failed to fetch variants for product '${productId}' - ${error.message}`
    );
  }
}

module.exports = {
  getProductsWithImages,
  getProductByIdWithImages,
  getProductsByCollection,
  getAllCollections,
  getProductVariants,
};
