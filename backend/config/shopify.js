require('dotenv').config();

const config = {
  shop: process.env.SHOPIFY_STORE_NAME,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN, // Changed from SHOPIFY_PASSWORD
  apiVersion: '2025-04',
  url: `https://${process.env.SHOPIFY_STORE_NAME}.myshopify.com/admin/api/2025-04/graphql.json`,
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN // Changed from SHOPIFY_PASSWORD
  }
};



module.exports = config;