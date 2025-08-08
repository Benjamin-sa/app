import dotenv from "dotenv";
dotenv.config();

interface ShopifyConfig {
  shop?: string;
  accessToken?: string;
  apiVersion: string;
  url: string;
  headers: Record<string, string>;
}

const config: ShopifyConfig = {
  shop: process.env.SHOPIFY_STORE_NAME,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  apiVersion: "2025-04",
  url: `https://${process.env.SHOPIFY_STORE_NAME}.myshopify.com/admin/api/2025-04/graphql.json`,
  headers: {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN || "",
  },
};

export default config;
module.exports = config;
