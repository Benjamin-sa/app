const express = require("express");
const multer = require("multer");
const { auth } = require("../config/firebase");
const forum = require("../services/forum.service");
const userService = require("../services/forum/user.service");
const imageService = require("../services/image.service");
const authenticate = require("../middleware/auth");
const { validators } = require("../models/forum.models");

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { email, password, username, displayName } = req.body;

    // Validate input
    if (!validators.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    if (!validators.isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        error:
          "Username must be 3-20 characters and contain only letters, numbers, and underscores",
      });
    }

    // Create Firebase user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || username,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to create user",
    });
  }
});

// Login (Firebase handles authentication client-side, this is for server-side validation)
router.post("/login", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "ID token is required",
      });
    }

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);

    res.json({
      success: true,
      message: "Login successful",
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        emailVerified: decodedToken.email_verified,
        picture: decodedToken.picture,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
});

// Get current user info (protected route)
router.get("/me", authenticate, async (req, res) => {
  try {
    const userRecord = await userService.getUserProfile(req.user.uid);

    if (!userRecord) {
      return res.status(404).json({
        success: false,
        error: "User profile not found",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      data: userRecord,
    });
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user information",
    });
  }
});

// Logout (invalidate token)
router.post("/logout", authenticate, async (req, res) => {
  try {
    // Revoke all refresh tokens for the user
    await auth.revokeRefreshTokens(req.user.uid);

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to logout",
    });
  }
});

// Update user profile
router.put("/profile", authenticate, async (req, res) => {
  try {
    const {
      username,
      displayName,
      bio,
      location,
      website,
      avatar,
      show_email,
      allow_messages,
    } = req.body;

    const updateData = {
      username,
      displayName,
      bio,
      location,
      website,
      avatar,
      show_email,
      allow_messages,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedUser = await userService.updateUserProfile(
      req.user.uid,
      updateData
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to update profile",
    });
  }
});

// Upload avatar endpoint
router.post(
  "/avatar",
  authenticate,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No avatar file provided",
        });
      }

      // Get current user profile to check for existing avatar
      const currentUser = await userService.getUserProfile(req.user.uid);

      // Upload new avatar image using image service
      const imageRecord = await imageService.uploadImage(
        req.file,
        `forum/avatars/${req.user.uid}`
      );

      // Update user profile with new avatar URL
      const updatedUser = await userService.updateUserProfile(req.user.uid, {
        avatar: imageRecord.url,
        avatarThumbnail: imageRecord.thumbnailUrl,
      });

      // Delete old avatar after successful upload and profile update
      if (currentUser && currentUser.avatar && currentUser.avatarThumbnail) {
        try {
          const oldAvatarRecord = {
            url: currentUser.avatar,
            thumbnailUrl: currentUser.avatarThumbnail,
            mediumUrl: currentUser.avatar, // Use main avatar as medium for deletion
          };
          await imageService.deleteImage(oldAvatarRecord);
        } catch (deleteError) {
          console.warn("Failed to delete old avatar:", deleteError.message);
          // Don't fail the request if old avatar deletion fails
        }
      }

      res.json({
        success: true,
        message: "Avatar uploaded successfully",
        data: {
          avatar_url: imageRecord.url,
          avatar_thumbnail: imageRecord.thumbnailUrl,
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error("Avatar Upload Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to upload avatar",
      });
    }
  }
);

// Verify email
router.post("/verify-email", authenticate, async (req, res) => {
  try {
    await auth.updateUser(req.user.uid, {
      emailVerified: true,
    });

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email Verification Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify email",
    });
  }
});

// Sync user (create or update user profile from any auth method)
router.post("/sync", authenticate, async (req, res) => {
  try {
    const {
      firebaseUid,
      email,
      displayName,
      photoURL,
      emailVerified,
      providerData,
    } = req.body;

    // Validate that the authenticated user matches the request
    if (req.user.uid !== firebaseUid) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized: UID mismatch",
      });
    }

    // Check if user already exists
    let existingUser = await userService.getUserProfile(firebaseUid);

    if (existingUser) {
      // Update existing user with any new information
      const updateData = {
        email: email || existingUser.email,
        displayName: displayName || existingUser.displayName,
        emailVerified: emailVerified || existingUser.emailVerified,
      };

      // Update avatar from social provider if user doesn't have one
      if (photoURL && !existingUser.avatar) {
        updateData.avatar = photoURL;
      }

      const updatedUser = await userService.updateUserProfile(
        firebaseUid,
        updateData
      );

      res.json({
        success: true,
        message: "User profile updated",
        data: updatedUser,
      });
    } else {
      // Create new user profile
      const username = await generateUniqueUsername(displayName || email);

      const newUser = await userService.createUserProfile({
        uid: firebaseUid,
        email,
        username,
        displayName: displayName || username,
        avatar: photoURL || "",
        emailVerified: emailVerified || false,
        authProvider: getAuthProvider(providerData),
      });

      res.status(201).json({
        success: true,
        message: "User profile created",
        data: newUser,
      });
    }
  } catch (error) {
    console.error("User Sync Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to sync user",
    });
  }
});

// Helper function to generate unique username
async function generateUniqueUsername(baseName) {
  if (!baseName) {
    baseName = "user";
  }

  // Clean the base name to make it username-friendly
  let cleanName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (cleanName.length < 3) {
    cleanName = "user_" + cleanName;
  }
  if (cleanName.length > 15) {
    cleanName = cleanName.substring(0, 15);
  }

  // Check if username exists
  let username = cleanName;
  let counter = 1;

  while (await userService.getUserByUsername(username)) {
    username = `${cleanName}_${counter}`;
    counter++;

    // Prevent infinite loops
    if (counter > 1000) {
      username = `user_${Date.now()}`;
      break;
    }
  }

  return username;
}

// Helper function to determine auth provider
function getAuthProvider(providerData) {
  if (
    !providerData ||
    !Array.isArray(providerData) ||
    providerData.length === 0
  ) {
    return "email";
  }

  const provider = providerData[0].providerId;
  switch (provider) {
    case "google.com":
      return "google";
    case "facebook.com":
      return "facebook";
    case "github.com":
      return "github";
    default:
      return "email";
  }
}

module.exports = router;
