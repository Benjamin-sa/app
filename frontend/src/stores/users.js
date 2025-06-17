import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { apiService } from "@/services/api.service";

export const useUsersStore = defineStore("users", () => {
  // State for caching user data
  const usersCache = ref(new Map()); // Map<userId, userData>
  const userLoadingStates = ref(new Map()); // Map<userId, boolean>
  const lastFetchTime = ref(new Map()); // Map<userId, timestamp> for cache invalidation

  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Getters
  const getUserFromCache = computed(() => {
    return (userId) => {
      if (!userId) return null;

      const cachedUser = usersCache.value.get(userId);
      const lastFetch = lastFetchTime.value.get(userId);

      // Check if cache is still valid
      if (cachedUser && lastFetch && Date.now() - lastFetch < CACHE_DURATION) {
        return cachedUser;
      }

      return null;
    };
  });

  const isUserLoading = computed(() => {
    return (userId) => userLoadingStates.value.get(userId) || false;
  });

  const getUserDisplayName = computed(() => {
    return (userId) => {
      const user = getUserFromCache.value(userId);
      if (!user) return "User";

      return (
        user.displayName || user.username || user.email?.split("@")[0] || "User"
      );
    };
  });

  const getUserAvatar = computed(() => {
    return (userId) => {
      const user = getUserFromCache.value(userId);
      if (!user) return null;

      return user.avatarThumbnail || user.avatar || user.photoURL || null;
    };
  });

  // Actions
  const setUserInCache = (userId, userData) => {
    if (!userId || !userData) return;

    usersCache.value.set(userId, userData);
    lastFetchTime.value.set(userId, Date.now());
  };

  const clearUserFromCache = (userId) => {
    if (!userId) return;

    usersCache.value.delete(userId);
    lastFetchTime.value.delete(userId);
    userLoadingStates.value.delete(userId);
  };

  const clearAllUsersCache = () => {
    usersCache.value.clear();
    lastFetchTime.value.clear();
    userLoadingStates.value.clear();
  };

  const setUserLoading = (userId, isLoading) => {
    if (!userId) return;

    if (isLoading) {
      userLoadingStates.value.set(userId, true);
    } else {
      userLoadingStates.value.delete(userId);
    }
  };

  // Main function to get user data (with caching)
  const getUser = async (userId, forceRefresh = false) => {
    if (!userId) return null;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedUser = getUserFromCache.value(userId);
      if (cachedUser) {
        return cachedUser;
      }
    }

    // Check if already loading to prevent duplicate requests
    if (isUserLoading.value(userId)) {
      // Wait for existing request (simple polling approach)
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!isUserLoading.value(userId)) {
            resolve(getUserFromCache.value(userId));
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }

    // Fetch from API
    setUserLoading(userId, true);

    try {
      const response = await apiService.get(`/forum/users/profile/${userId}`);

      if (response.success && response.data) {
        const userData = response.data;
        setUserInCache(userId, userData);
        return userData;
      } else {
        console.warn(`Failed to fetch user ${userId}:`, response.message);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return null;
    } finally {
      setUserLoading(userId, false);
    }
  };

  // Batch fetch multiple users (useful for loading many users at once)
  const getUsers = async (userIds, forceRefresh = false) => {
    if (!Array.isArray(userIds) || userIds.length === 0) return new Map();

    const results = new Map();
    const usersToFetch = [];

    // Check cache for each user
    for (const userId of userIds) {
      if (!userId) continue;

      if (!forceRefresh) {
        const cachedUser = getUserFromCache.value(userId);
        if (cachedUser) {
          results.set(userId, cachedUser);
          continue;
        }
      }

      // Add to fetch list if not in cache or force refresh
      if (!isUserLoading.value(userId)) {
        usersToFetch.push(userId);
      }
    }

    // Fetch all users that need fetching
    if (usersToFetch.length > 0) {
      const fetchPromises = usersToFetch.map((userId) =>
        getUser(userId, forceRefresh)
      );
      const fetchedUsers = await Promise.all(fetchPromises);

      // Add fetched users to results
      usersToFetch.forEach((userId, index) => {
        const userData = fetchedUsers[index];
        if (userData) {
          results.set(userId, userData);
        }
      });
    }

    // Wait for any currently loading users
    for (const userId of userIds) {
      if (!results.has(userId) && isUserLoading.value(userId)) {
        const userData = await getUser(userId);
        if (userData) {
          results.set(userId, userData);
        }
      }
    }

    return results;
  };

  // Invalidate cache for a specific user
  const invalidateUser = (userId) => {
    if (!userId) return;
    clearUserFromCache(userId);
  };

  // Update user data in cache (useful when user updates their profile)
  const updateUserInCache = (userId, updatedData) => {
    if (!userId || !updatedData) return;

    const existingUser = usersCache.value.get(userId);
    if (existingUser) {
      const mergedUser = { ...existingUser, ...updatedData };
      setUserInCache(userId, mergedUser);
    }
  };

  return {
    // Computed getters
    getUserFromCache,
    isUserLoading,
    getUserDisplayName,
    getUserAvatar,

    // Main actions
    getUser,
    getUsers,

    // Cache management
    setUserInCache,
    clearUserFromCache,
    clearAllUsersCache,
    invalidateUser,
    updateUserInCache,

    // Direct access to state (for debugging)
    usersCache: computed(() => usersCache.value),
    userLoadingStates: computed(() => userLoadingStates.value),
  };
});
