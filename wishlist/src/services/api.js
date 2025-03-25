import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Temporary user ID - in a real app, this would come from authentication
const DEFAULT_USER_ID = 'user123'

// Product API calls
export const productService = {
  getProducts(limit = 10) {
    return apiClient.get(`/products?limit=${limit}`)
  },

  getProductsWithImages(limit = 200) {
    return apiClient.get(`/products/with-images?limit=${limit}`).then((response) => {
      // Log the response structure to help with debugging
      console.log('Raw API Response:', response.data)
      return response
    })
  },

  getProduct(id) {
    return apiClient.get(`/products/${id}`)
  },

  getProductWithImages(id) {
    return apiClient.get(`/products/${id}/with-images`)
  },
}

// Wishlist API calls
export const wishlistService = {
  getWishlist(userId = DEFAULT_USER_ID) {
    return apiClient.get(`/wishlist/${userId}`)
  },

  addToWishlist(productId, userId = DEFAULT_USER_ID) {
    return apiClient.post(`/wishlist/${userId}/items`, { productId })
  },

  removeFromWishlist(itemId, userId = DEFAULT_USER_ID) {
    return apiClient.delete(`/wishlist/${userId}/items/${itemId}`)
  },
}
