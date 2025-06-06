const axios = require("axios");
const config = require("../config/shopify");
const queries = require("../graphql/shopifyQueries");

// Helper function to execute Shopify GraphQL queries
async function executeShopifyQuery(query) {
  try {
    const response = await axios({
      url: config.url,
      method: "POST",
      headers: config.headers,
      data: { query },
    });
    return response.data;
  } catch (error) {
    console.error("Error executing Shopify GraphQL query:", error);
    throw error;
  }
}

// Helper function to format product data
function formatProduct(
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

// Get products from Shopify
async function getProducts(limit = 10) {
  try {
    const query = queries.GET_PRODUCTS(limit);
    const data = await executeShopifyQuery(query);
    return data.data.products.edges.map((edge) => formatProduct(edge.node));
  } catch (error) {
    console.error("Error fetching products from Shopify:", error);
    throw error;
  }
}

async function getProductsByCollection(collectionHandle) {
  try {
    const query = queries.GET_PRODUCTS_BY_COLLECTION(collectionHandle);
    const data = await executeShopifyQuery(query);
    return data.data.collectionByHandle.products.edges.map((edge) =>
      formatProduct(edge.node, true, true)
    );
  } catch (error) {
    console.error("Error fetching products from collection:", error);
    throw error;
  }
}

// Get a single product by ID
async function getProductById(productId) {
  try {
    const query = queries.GET_PRODUCT_BY_ID(productId);
    const data = await executeShopifyQuery(query);
    const product = data.data.product;
    return product ? formatProduct(product) : null;
  } catch (error) {
    console.error(`Error fetching product ${productId} from Shopify:`, error);
    throw error;
  }
}

// Get products with images
async function getProductsWithImages(limit = 200) {
  try {
    const query = queries.GET_PRODUCTS_WITH_IMAGES(limit);
    const data = await executeShopifyQuery(query);
    return data.data.products.edges.map((edge) =>
      formatProduct(edge.node, true, true)
    );
  } catch (error) {
    console.error("Error fetching products with images from Shopify:", error);
    throw error;
  }
}

// Get a single product with images by ID
async function getProductByIdWithImages(productId) {
  try {
    const query = queries.GET_PRODUCT_BY_ID_WITH_IMAGES(productId);
    const data = await executeShopifyQuery(query);
    const product = data.data.product;
    return product ? formatProduct(product, true, true) : null;
  } catch (error) {
    console.error(
      `Error fetching product ${productId} with images from Shopify:`,
      error
    );
    throw error;
  }
}

module.exports = {
  getProducts,
  getProductById,
  getProductsWithImages,
  getProductByIdWithImages,
  getProductsByCollection,
  executeShopifyQuery,
  formatProduct,
};
