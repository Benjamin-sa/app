const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const axios = require("axios"); // Make sure to install axios if not already installed

// Store states temporarily to validate on callback
// In production, this should be in a database or Redis
const pendingAuthStates = new Map();

// Clean up expired states (older than 10 minutes)
function cleanupExpiredStates() {
  const now = Date.now();
  for (const [state, data] of pendingAuthStates.entries()) {
    if (now - data.timestamp > 600000) {
      // 10 minutes
      pendingAuthStates.delete(state);
    }
  }
}

// Generate a secure random state value
function generateStateParam() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Initiates the OAuth flow by redirecting to Shopify's authorization URL
 */
router.get("/shopify", (req, res) => {
  // Clean up expired states
  cleanupExpiredStates();

  // Generate a unique state parameter for CSRF protection
  const state = generateStateParam();

  // Store the state with a timestamp
  pendingAuthStates.set(state, {
    timestamp: Date.now(),
    shop: process.env.SHOPIFY_STORE_NAME, // In a multi-tenant app, this would be dynamic
  });

  // Define required scopes
  const scopes = "read_products,write_products"; // Add more scopes as needed

  // Make sure the redirect URI used here exactly matches the one registered in your Shopify app settings
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI;

  // Build the authorization URL
  const shopifyAuthUrl =
    `https://${process.env.SHOPIFY_STORE_NAME}.myshopify.com/admin/oauth/authorize?` +
    `client_id=${process.env.SHOPIFY_API_KEY}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}`;

  // Redirect the user to Shopify's authorization page
  res.redirect(shopifyAuthUrl);
});

/**
 * Callback endpoint for Shopify to redirect back to after authorization
 */
router.get("/callback", async (req, res) => {
  try {
    const { code, state, shop } = req.query;

    // Verify the state parameter to prevent CSRF attacks
    if (!pendingAuthStates.has(state)) {
      return res.status(403).json({ error: "Invalid state parameter" });
    }

    // Get stored data and verify shop
    const storedData = pendingAuthStates.get(state);

    // Delete the used state to prevent replay attacks
    pendingAuthStates.delete(state);

    if (storedData.shop !== shop.replace(".myshopify.com", "")) {
      return res.status(403).json({ error: "Shop mismatch" });
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }
    );

    // Get the access token from the response
    const accessToken = tokenResponse.data.access_token;

    // Redirect to the frontend with token in query parameter
    // In production, you might want to use a more secure method like httpOnly cookies
    res.redirect(
      `${process.env.FRONTEND_URL}/auth-success?token=${accessToken}`
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

module.exports = router;
