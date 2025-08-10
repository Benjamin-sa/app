import dotenv from "dotenv";
dotenv.config();

interface ShopifyConfig {
  shop?: string;
  storefrontAccessToken?: string;
  apiVersion: string;
  url: string;
  headers: Record<string, string>;
}

const config: ShopifyConfig = {
  shop: process.env.SHOPIFY_STORE_NAME,
  storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  apiVersion: "2025-04",
  url: `https://${process.env.SHOPIFY_STORE_NAME}.myshopify.com/api/2025-04/graphql.json`,
  headers: {
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token":
      process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "",
  },
};

export default config;
module.exports = config;
