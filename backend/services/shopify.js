const axios = require("axios");
const config = require("../config/shopify");
const queries = require("../graphql/shopifyQueries");

// Get products from Shopify
async function getProducts(limit = 10) {
  try {
    const query = queries.GET_PRODUCTS(limit);

    const response = await axios({
      url: config.url,
      method: "POST",
      headers: config.headers,
      data: { query },
    });

    return response.data.data.products.edges.map((edge) => ({
      id: edge.node.id.split("/").pop(),
      title: edge.node.title,
      handle: edge.node.handle,
      description: edge.node.description,
      price: edge.node.variants.edges[0]?.node.price || "0.00",
    }));
  } catch (error) {
    console.error("Error fetching products from Shopify:", error);
    throw error;
  }
}

// Get a single product by ID
async function getProductById(productId) {
  try {
    const query = queries.GET_PRODUCT_BY_ID(productId);

    const response = await axios({
      url: config.url,
      method: "POST",
      headers: config.headers,
      data: { query },
    });

    const product = response.data.data.product;
    if (!product) return null;

    return {
      id: product.id.split("/").pop(),
      title: product.title,
      handle: product.handle,
      description: product.description,
      price: product.variants.edges[0]?.node.price || "0.00",
    };
  } catch (error) {
    console.error(`Error fetching product ${productId} from Shopify:`, error);
    throw error;
  }
}

// Get products with images
async function getProductsWithImages(limit = 200) {
  try {
    const query = queries.GET_PRODUCTS_WITH_IMAGES(limit);

    const response = await axios({
      url: config.url,
      method: "POST",
      headers: config.headers,
      data: { query },
    });

    return response.data.data.products.edges.map((edge) => ({
      id: edge.node.id.split("/").pop(),
      title: edge.node.title,
      handle: edge.node.handle,
      description: edge.node.description,
      price: edge.node.variants.edges[0]?.node.price || "0.00",
      images: edge.node.images.edges.map((img) => ({
        id: img.node.id.split("/").pop(),
        src: img.node.url,
        alt: img.node.altText || edge.node.title,
      })),
      collections:
        edge.node.collections?.edges.map((col) => ({
          id: col.node.id.split("/").pop(),
          title: col.node.title,
          handle: col.node.handle,
        })) || [],
    }));
  } catch (error) {
    console.error("Error fetching products with images from Shopify:", error);
    throw error;
  }
}

// Get a single product with images by ID
async function getProductByIdWithImages(productId) {
  try {
    const query = queries.GET_PRODUCT_BY_ID_WITH_IMAGES(productId);

    const response = await axios({
      url: config.url,
      method: "POST",
      headers: config.headers,
      data: { query },
    });

    const product = response.data.data.product;
    if (!product) return null;

    return {
      id: product.id.split("/").pop(),
      title: product.title,
      handle: product.handle,
      description: product.description,
      price: product.variants.edges[0]?.node.price || "0.00",
      images: product.images.edges.map((img) => ({
        id: img.node.id.split("/").pop(),
        src: img.node.url,
        alt: img.node.altText || product.title,
      })),
      collections:
        product.collections?.edges.map((col) => ({
          id: col.node.id.split("/").pop(),
          title: col.node.title,
          handle: col.node.handle,
        })) || [],
    };
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
};
