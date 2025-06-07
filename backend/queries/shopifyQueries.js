/**
 * GraphQL queries for Shopify API
 */

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

// Get products by collection handle
const GET_PRODUCTS_BY_COLLECTION = (collectionHandle) => `{
  collectionByHandle(handle: "${collectionHandle}") {
   id
    title
    products(first: 50) {
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
        }
      }
    }
      
  }
}`;

// Get all collections
const GET_ALL_COLLECTIONS = () => `{
  collections(first: 50) {
    edges {
      node {
        id
        title
        handle
        description
      }
    }
  }
}`;

module.exports = {
  GET_PRODUCTS_WITH_IMAGES,
  GET_PRODUCT_BY_ID_WITH_IMAGES,
  GET_PRODUCTS_BY_COLLECTION,
  GET_ALL_COLLECTIONS,
};
