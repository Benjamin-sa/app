import { defineStore } from "pinia";
import { ref, computed } from "vue";
import authService from "@/services/auth.service";

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref(null);
  const loading = ref(false); // General loading for store operations
  const actionLoading = ref({}); // For specific action loading states e.g. { login: true, register: false }
  const error = ref(null);
  const initialized = ref(false);

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const userDisplayName = computed(
    () =>
      user.value?.displayName ||
      user.value?.username ||
      user.value?.email?.split("@")[0] ||
      "User"
  );
  const userAvatar = computed(
    () =>
      user.value?.avatarThumbnail ||
      user.value?.avatar ||
      user.value?.photoURL ||
      null
  );

  // State management actions
  const setUser = (userData) => {
    user.value = userData;
    error.value = null;
  };

  const setLoading = (isLoading, action = "general") => {
    if (action === "general") {
      loading.value = isLoading;
    } else {
      actionLoading.value = { ...actionLoading.value, [action]: isLoading };
    }
  };

  const setError = (errorMessage) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const clearUser = () => {
    user.value = null;
  };

  // Token management
  const getCurrentToken = async () => {
    try {
      const firebaseUser = await authService.getCurrentUser();
      return firebaseUser ? await firebaseUser.getIdToken(false) : null;
    } catch (err) {
      console.error("Error getting current token:", err);
      setError("Failed to retrieve session token.");
      return null;
    }
  };

  const refreshToken = async () => {
    try {
      const firebaseUser = await authService.getCurrentUser();
      if (firebaseUser) {
        await firebaseUser.getIdToken(true); // Force refresh
        console.log("Token refreshed successfully");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to refresh token:", err);
      setError("Failed to refresh session.");
      return false;
    }
  };

  // Initialize auth state
  const initialize = async () => {
    if (initialized.value) return;

    setLoading(true, "general");
    clearError();
    try {
      const userData = await authService.initializeAuth();
      if (userData) {
        setUser(userData);
      }
    } catch (err) {
      console.error("Initialization error in store:", err);
      setError(err.message || "Failed to initialize authentication.");
    } finally {
      setLoading(false, "general");
      initialized.value = true;
    }
  };

  const setupAuthListener = () => {
    return authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Only merge user data if we don't already have user data or if this is a real state change
        if (!user.value || initialized.value) {
          setLoading(true, "authChange");
          const userData = await authService.mergeUserData(firebaseUser);
          setUser(userData);
          setLoading(false, "authChange");
        }
      } else if (!firebaseUser && user.value) {
        clearUser();
      }
      if (!initialized.value) {
        initialized.value = true;
        setLoading(false, "general");
      }
    });
  };

  // Refresh user data from API
  const refreshUserData = async () => {
    if (!isAuthenticated.value) return;
    setLoading(true, "refreshUser");
    clearError();
    try {
      const firebaseUser = await authService.getCurrentUser();
      if (firebaseUser) {
        const userData = await authService.mergeUserData(firebaseUser);
        setUser(userData);
      }
    } catch (err) {
      console.error("Failed to refresh user data:", err);
      setError(err.message || "Failed to refresh user data.");
    } finally {
      setLoading(false, "refreshUser");
    }
  };

  // --- User Actions ---

  async function register(userData) {
    setLoading(true, "register");
    clearError();
    try {
      const result = await authService.register(userData);
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Store register error:", err);
      setError(
        err.message || "An unexpected error occurred during registration."
      );
      return {
        success: false,
        message:
          err.message || "An unexpected error occurred during registration.",
      };
    } finally {
      setLoading(false, "register");
    }
  }

  async function login(credentials) {
    setLoading(true, "login");
    clearError();
    try {
      const result = await authService.login(credentials);
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Store login error:", err);
      setError(err.message || "An unexpected error occurred during login.");
      return {
        success: false,
        message: err.message || "An unexpected error occurred during login.",
      };
    } finally {
      setLoading(false, "login");
    }
  }

  async function loginWithGoogle() {
    setLoading(true, "loginGoogle");
    clearError();
    try {
      const result = await authService.loginWithGoogle();
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Store Google login error:", err);
      setError(
        err.message || "An unexpected error occurred during Google login."
      );
      return {
        success: false,
        message:
          err.message || "An unexpected error occurred during Google login.",
      };
    } finally {
      setLoading(false, "loginGoogle");
    }
  }

  async function logout() {
    setLoading(true, "logout");
    clearError();
    try {
      const result = await authService.logout();
      if (result.success) {
        clearUser();
        return { success: true };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Store logout error:", err);
      setError(err.message || "An unexpected error occurred during logout.");
      return {
        success: false,
        message: err.message || "An unexpected error occurred during logout.",
      };
    } finally {
      setLoading(false, "logout");
    }
  }

  async function resetPassword(email) {
    setLoading(true, "resetPassword");
    clearError();
    try {
      const result = await authService.resetPassword(email);
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Store reset password error:", err);
      setError(
        err.message || "An unexpected error occurred during password reset."
      );
      return {
        success: false,
        message:
          err.message || "An unexpected error occurred during password reset.",
      };
    } finally {
      setLoading(false, "resetPassword");
    }
  }

  async function updateProfile(profileData, avatarFile = null) {
    setLoading(true, "updateProfile");
    clearError();
    try {
      const result = await authService.updateProfile(profileData, avatarFile);
      if (result.success) {
        setUser(result.user); // Update user state with the new profile data
        return { success: true, user: result.user };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Store update profile error:", err);
      setError(
        err.message || "An unexpected error occurred while updating profile."
      );
      return {
        success: false,
        message:
          err.message || "An unexpected error occurred while updating profile.",
      };
    } finally {
      setLoading(false, "updateProfile");
    }
  }

  return {
    // State
    user,
    loading,
    actionLoading,
    error,
    initialized,

    // Getters
    isAuthenticated,
    userDisplayName,
    userAvatar,

    // State management actions (internal use or specific cases)
    // setUser, // Prefer actions to modify state
    // setLoading, // Prefer actions to modify state
    // setError, // Prefer actions to modify state
    clearError,
    // clearUser, // Prefer logout action

    // Core responsibilities & Actions for components
    initialize,
    setupAuthListener,
    refreshUserData,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateProfile,

    // Token management
    getCurrentToken,
    refreshToken,
  };
});
