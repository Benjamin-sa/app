import { computed, watch } from "vue";
import { useUsersStore } from "@/stores/users";

/**
 * Composable for enhancing topics with user data
 *
 * This composable takes a reactive topics array and enhances each topic with
 * user information fetched from the users store. It automatically handles:
 * - Fetching user data for all unique users in the topics
 * - Caching user data to avoid redundant API calls
 * - Providing computed user display names and avatars
 * - Loading states for user data
 *
 * @param {Ref} topics - Reactive topics array
 * @returns {Object} Object containing:
 *   - topicsWithUsers: Enhanced topics with user data
 *   - fetchUsersForTopics: Function to manually fetch user data
 *
 * @example
 * const categoryTopics = computed(() => forumStore.getTopicsByCategory('general'));
 * const { topicsWithUsers } = useTopicsWithUsers(categoryTopics);
 */
export function useTopicsWithUsers(topics) {
  const usersStore = useUsersStore();

  // Enhanced topics with user data
  const topicsWithUsers = computed(() => {
    if (!topics.value || !Array.isArray(topics.value)) {
      return [];
    }

    return topics.value.map((topic) => {
      // Try different possible field names for user ID
      const userId = topic.userId || topic.authorId || topic.author?.id;
      const user = userId ? usersStore.getUserFromCache(userId) : null;

      return {
        ...topic,
        user: user,
        userDisplayName: userId
          ? usersStore.getUserDisplayName(userId)
          : topic.author?.name || "Unknown",
        userAvatar: userId
          ? usersStore.getUserAvatar(userId)
          : topic.author?.avatar || null,
        isUserLoading: userId ? usersStore.isUserLoading(userId) : false,
      };
    });
  });

  // Function to manually fetch users for current topics
  const fetchUsersForTopics = async (forceRefresh = false) => {
    if (
      !topics.value ||
      !Array.isArray(topics.value) ||
      topics.value.length === 0
    ) {
      return;
    }

    // Extract unique user IDs from topics
    const userIds = [
      ...new Set(
        topics.value
          .map((topic) => topic.userId || topic.authorId || topic.author?.id)
          .filter(Boolean)
      ),
    ];

    // Fetch user data for all unique users
    if (userIds.length > 0) {
      try {
        await usersStore.getUsers(userIds, forceRefresh);
      } catch (error) {
        console.error("Error fetching users for topics:", error);
      }
    }
  };

  // Watch for changes in topics and automatically fetch user data
  watch(
    () => topics.value,
    async (newTopics) => {
      if (newTopics && newTopics.length > 0) {
        await fetchUsersForTopics();
      }
    },
    { immediate: true }
  );

  return {
    topicsWithUsers,
    fetchUsersForTopics,
  };
}
