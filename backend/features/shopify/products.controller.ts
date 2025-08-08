import BaseController from "../../core/controller/base.controller";
import shopify from "./shopify.service";
import { Request, Response } from "express";

class ProductsController extends BaseController {
  constructor() {
    super("PRODUCTS");
  }

  private _getAndCacheProduct(productId: string) {
    const cacheKey = `product:${productId}`;
    return this.getCachedData(
      cacheKey,
      () => (shopify as any).getProductByIdWithImages(productId),
      900
    );
  }

  getProductsWithImages = this.wrap(
    async (req: Request) => {
      const limit = parseInt((req.query.limit as string) || "50");
      const productsFromShopify = await (shopify as any).getProductsWithImages(
        limit
      );
      if (productsFromShopify && productsFromShopify.length > 0) {
        for (const product of productsFromShopify) {
          const productCacheKey = `product:${product.id}`;
          await this.getCachedData(productCacheKey, () => product, 900);
        }
        return productsFromShopify;
      }
      return [];
    },
    { op: "Get Products With Images" }
  );

  getProductByIdWithImages = this.wrap(
    async (req: Request) => {
      const { id } = req.params;
      const product = await this._getAndCacheProduct(id);
      if (!product) throw new Error("NOT_FOUND_ERROR: Product not found");
      return product;
    },
    { op: "Get Product By ID With Images" }
  );

  getProductsByCollection = this.wrap(
    async (req: Request) => {
      const { id: collectionId } = req.params as any;
      const collectionProductIdsCacheKey = `collection:${collectionId}:productIds`;
      let productDetailsList: any[] = [];
      let productIds = await this.getCachedData(
        collectionProductIdsCacheKey,
        async () => {
          const productsFromShopify = await (
            shopify as any
          ).getProductsByCollection(collectionId);
          if (productsFromShopify && productsFromShopify.length > 0) {
            productDetailsList = productsFromShopify;
            return productsFromShopify.map((p: any) => p.id);
          }
          return [] as string[];
        },
        900
      );
      if (
        productDetailsList.length === 0 &&
        productIds &&
        productIds.length > 0
      ) {
        for (const productId of productIds) {
          const product = await this._getAndCacheProduct(productId as any);
          if (product) productDetailsList.push(product);
        }
      }
      return productDetailsList;
    },
    { op: "Get Products By Collection" }
  );

  getAllCollections = this.wrap(
    async () => {
      if (typeof (shopify as any).getAllCollections !== "function") {
        throw new Error("Collections endpoint not implemented");
      }
      return this.getCachedData(
        "collections:all",
        () => (shopify as any).getAllCollections(),
        1800
      );
    },
    { op: "Get All Collections" }
  );

  searchProducts = this.wrap(
    async (req: Request) => {
      const { q: searchTerm, limit = "50" } = req.query as any;
      if (!searchTerm || (searchTerm as string).trim().length < 2) {
        throw new Error(
          "VALIDATION_ERROR: Search term must be at least 2 characters"
        );
      }
      const productsToSearch: any[] = (await this.getCachedData(
        "search:allProductsSet",
        () => (shopify as any).getProductsWithImages(200),
        900
      )) as any[];
      const term = (searchTerm as string).trim().toLowerCase();
      const limitNum = parseInt(limit as string);
      const searchResults = (productsToSearch || [])
        .filter((product: any) => {
          return (
            product.title?.toLowerCase().includes(term) ||
            product.description?.toLowerCase().includes(term) ||
            (Array.isArray(product.tags) &&
              product.tags.some(
                (tag: any) =>
                  typeof tag === "string" && tag.toLowerCase().includes(term)
              )) ||
            (typeof product.tags === "string" &&
              product.tags.toLowerCase().includes(term))
          );
        })
        .slice(0, limitNum);
      return searchResults;
    },
    { op: "Search Products" }
  );

  getProductVariants = this.wrap(
    async (req: Request) => {
      const { id } = req.params;
      const variants = await this.getCachedData(
        `product:${id}:variants`,
        async () => {
          if (typeof (shopify as any).getProductVariants === "function") {
            return await (shopify as any).getProductVariants(id);
          } else {
            const productData: any = await this._getAndCacheProduct(id);
            return productData?.variants || null;
          }
        },
        900
      );
      if (!variants)
        throw new Error("NOT_FOUND_ERROR: Product variants not found");
      return variants;
    },
    { op: "Get Product Variants" }
  );
}

const productsController = new ProductsController();
export default productsController;
module.exports = productsController;
