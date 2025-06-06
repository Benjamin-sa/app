const { auth } = require("../config/firebase");

const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookie
    let token = req.headers.authorization?.split("Bearer ")[1];

    // Fallback to cookie if no header (for web apps)
    if (!token && req.cookies?.authToken) {
      token = req.cookies.authToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No authentication token provided",
      });
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);

    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      displayName: decodedToken.name,
      picture: decodedToken.picture,
      firebase: decodedToken, // Full Firebase token for additional claims
    };

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

module.exports = authenticate;
