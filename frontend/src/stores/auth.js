import { defineStore } from "pinia";
import { ref, computed } from "vue";
import authService from "@/services/auth.service";
import { apiService } from "@/services/api.service";

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const initialized = ref(false);

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const userDisplayName = computed(
    () => user.value?.displayName || user.value?.email?.split("@")[0] || "User"
  );
  const userAvatar = computed(
    () => user.value?.avatar || user.value?.photoURL || null
  ); // Use user.value.avatar first

  // Get current token from Firebase
  const getCurrentToken = async () => {
    try {
      const firebaseUser = await authService.getCurrentUser();
      if (firebaseUser) {
        return await firebaseUser.getIdToken(false);
      }
      return null;
    } catch (error) {
      console.error("Error getting current token:", error);
      return null;
    }
  };

  const refreshToken = async () => {
    try {
      const firebaseUser = await authService.getCurrentUser();
      if (firebaseUser) {
        // Force token refresh
        await firebaseUser.getIdToken(true);
        console.log("Token refreshed successfully");
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return false;
    }
  };

  // Helper function to merge Firebase user with backend data
  const mergeUserData = async (firebaseUser) => {
    try {
      const response = await apiService.getCurrentUserFromApi();
      if (response.success && response.data) {
        // User exists in backend, merge data
        return { ...firebaseUser, ...response.data };
      } else {
        // User doesn't exist in backend, sync them
        console.log("User not found in backend, syncing...");
        await syncUserWithBackend(firebaseUser);

        // Try to get user data again after sync
        const syncResponse = await apiService.getCurrentUserFromApi();
        if (syncResponse.success && syncResponse.data) {
          return { ...firebaseUser, ...syncResponse.data };
        }
      }
    } catch (err) {
      console.error("Failed to get backend user data:", err);

      // If it's a 404 or user not found error, try to sync
      if (err.response?.status === 404 || err.message?.includes("not found")) {
        try {
          console.log("404 error, attempting to sync user...");
          await syncUserWithBackend(firebaseUser);

          // Try again after sync
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
  };

  // Helper function to sync user with backend (only when needed)
  const syncUserWithBackend = async (firebaseUser) => {
    try {
      console.log("Syncing user with backend:", firebaseUser.uid);
      await apiService.syncUser({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName:
          firebaseUser.displayName || firebaseUser.email?.split("@")[0],
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        providerData: firebaseUser.providerData,
      });
    } catch (err) {
      console.error("Failed to sync user with backend:", err);
      // Don't throw error to avoid blocking authentication
    }
  };

  // Actions
  const initialize = async () => {
    if (initialized.value) return;

    loading.value = true;
    try {
      const firebaseUser = await authService.getCurrentUser();
      if (firebaseUser) {
        user.value = await mergeUserData(firebaseUser);
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
      error.value = "Failed to initialize authentication";
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  };

  const login = async (credentials) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await authService.login(
        credentials.email,
        credentials.password
      );

      if (result.success) {
        user.value = await mergeUserData(result.user);
        return { success: true };
      } else {
        error.value = result.message;
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Login error:", err);
      error.value = "Login failed. Please try again.";
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const loginWithGoogle = async () => {
    loading.value = true;
    error.value = null;

    try {
      const result = await authService.loginWithGoogle();

      if (result.success) {
        user.value = await mergeUserData(result.user);
        return { success: true };
      } else {
        error.value = result.message;
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Google login error:", err);
      error.value = "Google login failed. Please try again.";
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const register = async (userData) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await authService.register(
        userData.email,
        userData.password,
        userData.displayName
      );

      if (result.success) {
        // For registration, always sync to create the user profile
        await syncUserWithBackend(result.user);
        user.value = await mergeUserData(result.user);
        return { success: true };
      } else {
        error.value = result.message;
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Registration error:", err);
      error.value = "Registration failed. Please try again.";
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    loading.value = true;
    error.value = null;

    try {
      const result = await authService.logout();
      if (result.success) {
        user.value = null;
        return { success: true };
      } else {
        error.value = result.message;
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Logout error:", err);
      error.value = "Logout failed. Please try again.";
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const resetPassword = async (email) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await authService.resetPassword(email);
      return result;
    } catch (err) {
      console.error("Password reset error:", err);
      error.value = "Password reset failed. Please try again.";
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const updateProfile = async (profileData, avatarFile = null) => {
    loading.value = true;
    error.value = null;

    try {
      let response;
      const endpoint = "/auth/profile";

      if (avatarFile) {
        const formData = new FormData();
        // Append all profileData fields to formData
        for (const key in profileData) {
          if (profileData[key] !== undefined && profileData[key] !== null) {
            formData.append(key, profileData[key]);
          }
        }
        formData.append("avatar", avatarFile);

        response = await apiService.put(endpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        response = await apiService.put(endpoint, profileData);
      }

      if (response.success) {
        // The backend now returns the full user object and optionally avatar_url/thumbnail
        // in response.data.user and response.data.avatar_url etc.
        const updatedUserData = response.data.user;
        if (response.data.avatar_url) {
          updatedUserData.avatar = response.data.avatar_url;
        }
        if (response.data.avatar_thumbnail) {
          updatedUserData.avatarThumbnail = response.data.avatar_thumbnail;
        }

        user.value = {
          ...user.value,
          ...updatedUserData,
        };
        return { success: true, data: user.value }; // Return the updated user from store
      } else {
        error.value = response.error || response.message;
        return { success: false, message: error.value };
      }
    } catch (err) {
      console.error("Profile update error:", err);
      error.value =
        err.response?.data?.error ||
        err.message ||
        "Profile update failed. Please try again.";
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  // Setup auth state listener
  const setupAuthListener = () => {
    return authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser && !user.value) {
        // User logged in from another tab/window
        user.value = await mergeUserData(firebaseUser);
      } else if (!firebaseUser && user.value) {
        // User logged out from another tab/window
        user.value = null;
      }
    });
  };

  return {
    // State
    user,
    loading,
    error,
    initialized,

    // Getters
    isAuthenticated,
    userDisplayName,
    userAvatar,

    // Actions
    initialize,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    updateProfile,
    refreshToken,
    getCurrentToken,
    clearError,
    setupAuthListener,
  };
});
