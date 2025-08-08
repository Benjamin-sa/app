import axios from "axios";
import config from "../../config/shopify";
const queries = require("../../queries/shopifyQueries");
import { ValidationError, validateId } from "../../utils/validation.utils";

interface FormattedImage {
  id: string;
  src: string;
  alt: string;
}
interface FormattedCollection {
  id: string;
  title: string;
  handle: string;
}
interface FormattedVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  sku?: string;
  barcode?: string;
  availableForSale?: boolean;
  quantityAvailable?: number;
  weight?: number;
  weightUnit?: string;
  selectedOptions?: any[];
}
interface FormattedProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  price: string;
  images?: FormattedImage[];
  collections?: FormattedCollection[];
  variants?: FormattedVariant[];
  tags?: string[] | string;
}

async function _executeShopifyQuery(query: string) {
  try {
    const response = await axios({
      url: config.url,
      method: "POST",
      headers: config.headers,
      data: { query },
    });
    if ((response.data as any).errors) {
      throw new Error(
        `SHOPIFY_SERVICE_ERROR: GraphQL errors - ${(response.data as any).errors
          .map((err: any) => err.message)
          .join(", ")}`
      );
    }
    return response.data;
  } catch (error: any) {
    if (error.message?.includes("SHOPIFY_SERVICE_ERROR:")) throw error;
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND")
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Unable to connect to Shopify API"
      );
    if (error.response?.status === 401)
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Unauthorized - Invalid Shopify credentials"
      );
    if (error.response?.status === 429)
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Rate limit exceeded - Too many requests"
      );
    throw new Error(
      `SHOPIFY_SERVICE_ERROR: Failed to execute GraphQL query - ${error.message}`
    );
  }
}

function _formatProduct(
  product: any,
  includeImages = false,
  includeCollections = false
): FormattedProduct {
  const formatted: FormattedProduct = {
    id: product.id.split("/").pop(),
    title: product.title,
    handle: product.handle,
    description: product.description,
    price: product.variants.edges[0]?.node.price || "0.00",
  };
  if (includeImages && product.images) {
    formatted.images = product.images.edges.map((img: any) => ({
      id: img.node.id.split("/").pop(),
      src: img.node.url,
      alt: img.node.altText || product.title,
    }));
  }
  if (includeCollections && product.collections) {
    formatted.collections =
      product.collections.edges.map((col: any) => ({
        id: col.node.id.split("/").pop(),
        title: col.node.title,
        handle: col.node.handle,
      })) || [];
  }
  return formatted;
}

export async function getProductsByCollection(collectionHandle: string) {
  try {
    if (!collectionHandle || typeof collectionHandle !== "string")
      throw new Error(
        "SHOPIFY_SERVICE_VALIDATION_ERROR: Collection handle must be a string"
      );
    const query = queries.GET_PRODUCTS_BY_COLLECTION(collectionHandle);
    const data = await _executeShopifyQuery(query);
    if (!data.data?.collectionByHandle)
      throw new Error(
        `SHOPIFY_SERVICE_NOT_FOUND_ERROR: Collection '${collectionHandle}' not found`
      );
    return data.data.collectionByHandle.products.edges.map((edge: any) =>
      _formatProduct(edge.node, true, true)
    );
  } catch (error: any) {
    if (error.message?.includes("SHOPIFY_SERVICE_")) throw error;
    throw new Error(
      `SHOPIFY_SERVICE_ERROR: Failed to fetch products from collection '${collectionHandle}' - ${error.message}`
    );
  }
}

export async function getAllCollections() {
  try {
    const query = queries.GET_ALL_COLLECTIONS();
    const data = await _executeShopifyQuery(query);
    if (!data.data?.collections)
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Invalid response structure for collections"
      );
    return data.data.collections.edges.map((edge: any) => ({
      id: edge.node.id.split("/").pop(),
      title: edge.node.title,
      handle: edge.node.handle,
      description: edge.node.description || "",
    }));
  } catch (error: any) {
    if (error.message?.includes("SHOPIFY_SERVICE_")) throw error;
    throw new Error(
      `SHOPIFY_SERVICE_ERROR: Failed to fetch collections - ${error.message}`
    );
  }
}

export async function getProductsWithImages(limit = 200) {
  try {
    if (limit && (typeof limit !== "number" || limit < 1 || limit > 250))
      throw new Error(
        "SHOPIFY_SERVICE_VALIDATION_ERROR: Limit must be a number between 1 and 250"
      );
    const query = queries.GET_PRODUCTS_WITH_IMAGES(limit);
    const data = await _executeShopifyQuery(query);
    if (!data.data?.products)
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Invalid response structure for products"
      );
    return data.data.products.edges.map((edge: any) =>
      _formatProduct(edge.node, true, true)
    );
  } catch (error: any) {
    if (error.message?.includes("SHOPIFY_SERVICE_")) throw error;
    throw new Error(
      `SHOPIFY_SERVICE_ERROR: Failed to fetch products with images - ${error.message}`
    );
  }
}

export async function getProductByIdWithImages(productId: string) {
  try {
    const validatedProductId = validateId(productId);
    const query = queries.GET_PRODUCT_BY_ID_WITH_IMAGES(validatedProductId);
    const data = await _executeShopifyQuery(query);
    if (!data.data)
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Invalid response structure for product"
      );
    const product = data.data.product;
    if (!product)
      throw new Error(
        `SHOPIFY_SERVICE_NOT_FOUND_ERROR: Product with ID '${validatedProductId}' not found`
      );
    return _formatProduct(product, true, true);
  } catch (error: any) {
    if (error instanceof ValidationError)
      throw new Error(`SHOPIFY_SERVICE_VALIDATION_ERROR: ${error.message}`);
    if (error.message?.includes("SHOPIFY_SERVICE_")) throw error;
    throw new Error(
      `SHOPIFY_SERVICE_ERROR: Failed to fetch product '${productId}' with images - ${error.message}`
    );
  }
}

export async function getProductVariants(productId: string) {
  try {
    const validatedProductId = validateId(productId);
    const query = queries.GET_PRODUCT_BY_ID_WITH_IMAGES(validatedProductId);
    const data = await _executeShopifyQuery(query);
    if (!data.data)
      throw new Error(
        "SHOPIFY_SERVICE_ERROR: Invalid response structure for product variants"
      );
    const product = data.data.product;
    if (!product)
      throw new Error(
        `SHOPIFY_SERVICE_NOT_FOUND_ERROR: Product with ID '${validatedProductId}' not found`
      );
    if (!product.variants || !product.variants.edges)
      throw new Error(
        `SHOPIFY_SERVICE_NOT_FOUND_ERROR: No variants found for product '${validatedProductId}'`
      );
    return product.variants.edges.map((edge: any) => ({
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
  } catch (error: any) {
    if (error instanceof ValidationError)
      throw new Error(`SHOPIFY_SERVICE_VALIDATION_ERROR: ${error.message}`);
    if (error.message?.includes("SHOPIFY_SERVICE_")) throw error;
    throw new Error(
      `SHOPIFY_SERVICE_ERROR: Failed to fetch variants for product '${productId}' - ${error.message}`
    );
  }
}

export default {
  getProductsWithImages,
  getProductByIdWithImages,
  getProductsByCollection,
  getAllCollections,
  getProductVariants,
};
module.exports = {
  getProductsWithImages,
  getProductByIdWithImages,
  getProductsByCollection,
  getAllCollections,
  getProductVariants,
};
