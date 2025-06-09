import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { apiService } from "@/services/api.service";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

class AuthService {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.googleProvider = new GoogleAuthProvider();
  }

  // Initialize authentication and return user data
  async initializeAuth() {
    try {
      const firebaseUser = await this.getCurrentUser();
      if (firebaseUser) {
        return await this.mergeUserData(firebaseUser);
      }
      return null;
    } catch (error) {
      console.error("Auth initialization error:", error);
      return null;
    }
  }

  // Get current user
  getCurrentUser() {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        this.auth,
        (user) => {
          unsubscribe();
          resolve(user);
        },
        reject
      );
    });
  }

  // Helper function to merge Firebase user with backend data
  async mergeUserData(firebaseUser) {
    try {
      const response = await apiService.getCurrentUserFromApi();
      if (response.success && response.data) {
        return { ...firebaseUser, ...response.data };
      } else {
        console.log("User not found in backend, syncing...");
        await this.syncUserWithBackend();

        const syncResponse = await apiService.getCurrentUserFromApi();
        if (syncResponse.success && syncResponse.data) {
          return { ...firebaseUser, ...syncResponse.data };
        }
      }
    } catch (err) {
      console.error("Failed to get backend user data:", err);

      if (err.response?.status === 404 || err.message?.includes("not found")) {
        try {
          console.log("404 error, attempting to sync user...");
          await this.syncUserWithBackend();

          const retryResponse = await apiService.getCurrentUserFromApi();
          if (retryResponse.success && retryResponse.data) {
            return { ...firebaseUser, ...retryResponse.data };
          }
        } catch (syncErr) {
          console.error("Failed to sync user:", syncErr);
        }
      }
    }
    return firebaseUser;
  }

  // Helper function to sync user with backend
  async syncUserWithBackend() {
    try {
      await apiService.post("/auth/sync");
    } catch (err) {
      console.error("Failed to sync user with backend:", err);
      throw err;
    }
  }

  // Register with email and password
  async register(userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      );

      if (userData.displayName) {
        await updateProfile(userCredential.user, {
          displayName: userData.displayName,
        });
      }

      await this.syncUserWithBackend();
      const mergedUser = await this.mergeUserData(userCredential.user);

      return { success: true, user: mergedUser };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  // Login with email and password
  async login(credentials) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      const mergedUser = await this.mergeUserData(userCredential.user);
      return { success: true, user: mergedUser };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  // Login with Google
  async loginWithGoogle() {
    try {
      const userCredential = await signInWithPopup(
        this.auth,
        this.googleProvider
      );

      const mergedUser = await this.mergeUserData(userCredential.user);
      return { success: true, user: mergedUser };
    } catch (error) {
      console.error("Google login error:", error);
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(this.auth);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    } catch (error) {
      console.error("Password reset error:", error);
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  // Update user profile
  async updateProfile(profileData, avatarFile = null) {
    try {
      let response;
      const endpoint = "/auth/profile";

      if (avatarFile) {
        const formData = new FormData();
        for (const key in profileData) {
          if (profileData[key] !== undefined && profileData[key] !== null) {
            formData.append(key, profileData[key]);
          }
        }
        formData.append("avatar", avatarFile);

        response = await apiService.put(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await apiService.put(endpoint, profileData);
      }

      if (response.success) {
        const updatedUserData = response.data.user;
        if (response.data.avatar_url) {
          updatedUserData.avatar = response.data.avatar_url;
        }
        if (response.data.avatar_thumbnail) {
          updatedUserData.avatarThumbnail = response.data.avatar_thumbnail;
        }

        const firebaseUser = await this.getCurrentUser();
        const mergedUser = { ...firebaseUser, ...updatedUserData };

        return { success: true, user: mergedUser };
      } else {
        return {
          success: false,
          message:
            response.error || response.message || "Profile update failed",
        };
      }
    } catch (err) {
      console.error("Profile update error:", err);
      return {
        success: false,
        message:
          err.response?.data?.error ||
          err.message ||
          "Profile update failed. Please try again.",
      };
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(this.auth, callback);
  }

  // Convert Firebase error codes to user-friendly messages
  getErrorMessage(errorCode) {
    switch (errorCode) {
      case "auth/user-not-found":
        return "No account found with this email address.";
      case "auth/wrong-password":
        return "Incorrect password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/invalid-email":
        return "Invalid email address.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection.";
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed before completing the sign-in.";
      case "auth/cancelled-popup-request":
        return "Only one popup request is allowed at one time.";
      default:
        return "An error occurred during authentication.";
    }
  }
}

export default new AuthService();
