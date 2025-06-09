const { auth } = require("../../config/firebase");

const getTokenFromRequest = (req) => {
  return (
    req.headers.authorization?.split("Bearer ")[1] || req.cookies?.authToken
  );
};

const createUserObject = (decodedToken) => ({
  uid: decodedToken.uid,
  email: decodedToken.email,
  emailVerified: decodedToken.email_verified,
  displayName: decodedToken.name,
  picture: decodedToken.picture,
  firebase: decodedToken,
});

const authenticate = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "No authentication token provided" });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = createUserObject(decodedToken);

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }
};

const identify = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      req.user = null;
      return next();
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = createUserObject(decodedToken);
    next();
  } catch (error) {
    console.error("Identify Error (non-blocking):", error);
    req.user = null;
    next();
  }
};

module.exports = { authenticate, identify };
