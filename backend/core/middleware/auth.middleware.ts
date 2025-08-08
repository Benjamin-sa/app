import { Request, Response, NextFunction } from "express";
import { auth } from "../../config/firebase";

const getTokenFromRequest = (req: Request): string | undefined => {
  return (
    req.headers.authorization?.split("Bearer ")[1] ||
    (req as any).cookies?.authToken
  );
};

const createUserObject = (decodedToken: any) => ({
  uid: decodedToken.uid,
  email: decodedToken.email,
  emailVerified: decodedToken.email_verified,
  displayName: decodedToken.name,
  picture: decodedToken.picture,
  firebase: decodedToken,
});

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

export const identify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

export default { authenticate, identify };
