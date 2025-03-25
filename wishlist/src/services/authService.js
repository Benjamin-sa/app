export const authService = {
  /**
   * Initiate Shopify OAuth authentication
   */
  initiateShopifyAuth() {
    // Redirect browser to the backend auth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/shopify`
  },

  /**
   * Handle the successful authentication callback
   * @param {string} token - The access token from Shopify
   */
  handleAuthSuccess(token) {
    if (token) {
      localStorage.setItem('shopifyToken', token)
      return true
    }
    return false
  },

  /**
   * Check if the current user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    // This would check for a valid token in localStorage or cookies
    return !!localStorage.getItem('shopifyToken')
  },

  /**
   * Logout the current user
   */
  logout() {
    localStorage.removeItem('shopifyToken')
    // You might want to redirect to a login page here
  },
}

export default authService
