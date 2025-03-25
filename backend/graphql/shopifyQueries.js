/**
 * GraphQL queries for Shopify API
 */

// Get products with basic information
const GET_PRODUCTS = (limit = 10) => `{
  products(first: ${limit}) {
    edges {
      node {
        id
        title
        handle
        description
        variants(first: 1) {
          edges {
            node {
              price
            }
          }
        }
      }
    }
  }
}`;

// Get a single product by ID
const GET_PRODUCT_BY_ID = (productId) => `{
  product(id: "gid://shopify/Product/${productId}") {
    id
    title
    handle
    description
    variants(first: 1) {
      edges {
        node {
          price
        }
      }
    }
  }
}`;

// Get products with images
const GET_PRODUCTS_WITH_IMAGES = (limit = 200) => `{
  products(first: ${limit}) {
    edges {
      node {
        id
        title
        handle
        description
        variants(first: 1) {
          edges {
            node {
              price
            }
          }
        }
        images(first: 10) {
          edges {
            node {
              id
              url
              altText
            }
          }
        }
        collections(first: 5) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    }
  }
}`;

// Get a single product with images by ID
const GET_PRODUCT_BY_ID_WITH_IMAGES = (productId) => `{
  product(id: "gid://shopify/Product/${productId}") {
    id
    title
    handle
    description
    variants(first: 1) {
      edges {
        node {
          price
        }
      }
    }
    images(first: 10) {
      edges {
        node {
          id
          url
          altText
        }
      }
    }
    collections(first: 5) {
      edges {
        node {
          id
          title
          handle
        }
      }
    }
  }
}`;

module.exports = {
  GET_PRODUCTS,
  GET_PRODUCT_BY_ID,
  GET_PRODUCTS_WITH_IMAGES,
  GET_PRODUCT_BY_ID_WITH_IMAGES,
};
