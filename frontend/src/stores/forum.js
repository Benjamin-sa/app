import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { apiService } from "@/services/api.service";

export const useForumStore = defineStore("forum", () => {
  // State
  const topics = ref(new Map()); // Map<topicId, topic>
  const answers = ref(new Map()); // Map<topicId, answers[]>
  const loadingStates = ref(new Map()); // Map<topicId, boolean>
  const loadingTopics = ref(false);
  const loadingAnswers = ref(new Map()); // Map<topicId, boolean>
  const isCreatingTopic = ref(false);
  const searchResults = ref([]);
  const loadingSearch = ref(false);
  const error = ref(null);

  // Getters
  const getTopic = computed(() => {
    return (topicId) => topics.value.get(topicId) || null;
  });

  const getTopicAnswers = computed(() => {
    return (topicId) => answers.value.get(topicId) || [];
  });

  const isLoadingTopic = computed(() => {
    return (topicId) => loadingStates.value.get(topicId) || false;
  });

  const isLoadingTopicAnswers = computed(() => {
    return (topicId) => loadingAnswers.value.get(topicId) || false;
  });

  const getTopicsList = computed(() => {
    return Array.from(topics.value.values()).sort((a, b) => {
      // Handle Firestore timestamp format
      const getTimestamp = (timestamp) => {
        if (!timestamp) return 0;
        if (timestamp._seconds) {
          return (
            timestamp._seconds * 1000 +
            Math.floor(timestamp._nanoseconds / 1000000)
          );
        }
        return new Date(timestamp).getTime();
      };

      const aTime = getTimestamp(a.lastActivity || a.updatedAt || a.createdAt);
      const bTime = getTimestamp(b.lastActivity || b.updatedAt || b.createdAt);

      return bTime - aTime; // Most recent first
    });
  });

  // Actions
  const setError = (errorMessage) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const setLoadingTopic = (topicId, isLoading) => {
    if (isLoading) {
      loadingStates.value.set(topicId, true);
    } else {
      loadingStates.value.delete(topicId);
    }
  };

  const setLoadingTopicAnswers = (topicId, isLoading) => {
    if (isLoading) {
      loadingAnswers.value.set(topicId, true);
    } else {
      loadingAnswers.value.delete(topicId);
    }
  };

  // Load topics list
  const loadTopics = async (options = {}) => {
    loadingTopics.value = true;
    clearError();

    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        sortBy = "createdAt",
      } = options;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
      });

      if (category) {
        params.append("category", category);
      }

      const response = await apiService.get(`/forum/topics?${params}`);

      if (response.success && response.data) {
        const topicsArray = response.data.topics || response.data;

        if (Array.isArray(topicsArray)) {
          // Add topics to store (don't clear - allow pagination)
          topicsArray.forEach((topic) => {
            topics.value.set(topic.id, topic);
          });

          return {
            topics: topicsArray,
            hasMore: response.data.hasMore || false,
          };
        }
      }

      setError("Failed to load topics");
      return { topics: [], hasMore: false };
    } catch (error) {
      console.error("Error loading topics:", error);
      setError("Failed to load topics");
      return { topics: [], hasMore: false };
    } finally {
      loadingTopics.value = false;
    }
  };

  // Load single topic
  const loadTopic = async (topicId) => {
    if (!topicId) return null;

    setLoadingTopic(topicId, true);
    clearError();

    try {
      const response = await apiService.get(`/forum/topics/${topicId}`);

      if (response.success && response.data) {
        const topic = response.data;
        topics.value.set(topicId, topic);
        return topic;
      } else {
        setError("Failed to load topic");
        return null;
      }
    } catch (error) {
      console.error("Error loading topic:", error);
      setError("Failed to load topic");
      return null;
    } finally {
      setLoadingTopic(topicId, false);
    }
  };

  // Load answers for a topic
  const loadAnswers = async (topicId) => {
    if (!topicId) return [];

    setLoadingTopicAnswers(topicId, true);
    clearError();

    try {
      const response = await apiService.get(`/forum/answers/${topicId}`);

      if (response.success && response.data) {
        const answersData = response.data.answers || response.data || [];
        answers.value.set(topicId, answersData);
        return answersData;
      } else {
        setError("Failed to load answers");
        return [];
      }
    } catch (error) {
      console.error("Error loading answers:", error);
      setError("Failed to load answers");
      return [];
    } finally {
      setLoadingTopicAnswers(topicId, false);
    }
  };

  // Create new topic
  const createTopic = async (topicData) => {
    isCreatingTopic.value = true;
    clearError();

    try {
      const response = await apiService.post("/forum/topics", topicData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.success && response.data) {
        const newTopic = response.data;
        topics.value.set(newTopic.id, newTopic);
        return newTopic;
      } else {
        setError("Failed to create topic");
        return null;
      }
    } catch (error) {
      console.error("Error creating topic:", error);
      setError("Failed to create topic");
      return null;
    } finally {
      isCreatingTopic.value = false;
    }
  };

  // Update topic
  const updateTopic = async (topicId, updateData) => {
    if (!topicId) return null;

    clearError();

    try {
      const response = await apiService.patch(
        `/forum/topics/${topicId}`,
        updateData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.success && response.data) {
        const updatedTopic = response.data;
        topics.value.set(topicId, updatedTopic);
        return updatedTopic;
      } else {
        setError("Failed to update topic");
        return null;
      }
    } catch (error) {
      console.error("Error updating topic:", error);
      setError("Failed to update topic");
      return null;
    }
  };

  // Delete topic
  const deleteTopic = async (topicId) => {
    if (!topicId) return false;

    clearError();

    try {
      const response = await apiService.delete(`/forum/topics/${topicId}`);

      if (response.success) {
        topics.value.delete(topicId);
        answers.value.delete(topicId);
        return true;
      } else {
        setError("Failed to delete topic");
        return false;
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
      setError("Failed to delete topic");
      return false;
    }
  };

  // Create answer
  const createAnswer = async (topicId, answerData) => {
    if (!topicId) return null;

    clearError();

    try {
      const response = await apiService.post(
        `/forum/answers/${topicId}`,
        answerData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.success && response.data) {
        const newAnswer = response.data;

        // Add answer to the topic's answers
        const existingAnswers = answers.value.get(topicId) || [];
        answers.value.set(topicId, [...existingAnswers, newAnswer]);

        // Update topic's answer count if it exists in store
        const topic = topics.value.get(topicId);
        if (topic) {
          topic.answerCount = (topic.answerCount || 0) + 1;
        }

        return newAnswer;
      } else {
        setError("Failed to create answer");
        return null;
      }
    } catch (error) {
      console.error("Error creating answer:", error);
      setError("Failed to create answer");
      return null;
    }
  };

  // Update answer
  const updateAnswer = async (answerId, updateData, topicId = null) => {
    if (!answerId) return null;

    clearError();

    try {
      const response = await apiService.patch(
        `/forum/answers/${answerId}`,
        updateData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.success && response.data) {
        const updatedAnswer = response.data;

        // Find and update the answer in the appropriate topic
        if (topicId && answers.value.has(topicId)) {
          // If topicId is provided, update directly
          const topicAnswers = answers.value.get(topicId);
          const answerIndex = topicAnswers.findIndex((a) => a.id === answerId);
          if (answerIndex !== -1) {
            const updatedAnswers = [...topicAnswers];
            updatedAnswers[answerIndex] = updatedAnswer;
            answers.value.set(topicId, updatedAnswers);
          }
        } else {
          // Fallback: search through all topics
          for (const [topicId, topicAnswers] of answers.value.entries()) {
            const answerIndex = topicAnswers.findIndex(
              (a) => a.id === answerId
            );
            if (answerIndex !== -1) {
              const updatedAnswers = [...topicAnswers];
              updatedAnswers[answerIndex] = updatedAnswer;
              answers.value.set(topicId, updatedAnswers);
              break;
            }
          }
        }

        return updatedAnswer;
      } else {
        setError("Failed to update answer");
        return null;
      }
    } catch (error) {
      console.error("Error updating answer:", error);
      setError("Failed to update answer");
      return null;
    }
  };

  // Delete answer
  const deleteAnswer = async (answerId, topicId) => {
    if (!answerId) return false;

    clearError();

    try {
      const response = await apiService.delete(`/forum/answers/${answerId}`, {
        data: { topicId },
      });

      if (response.success) {
        // Remove answer from the topic's answers
        if (topicId) {
          const topicAnswers = answers.value.get(topicId) || [];
          const filteredAnswers = topicAnswers.filter((a) => a.id !== answerId);
          answers.value.set(topicId, filteredAnswers);

          // Update topic's answer count
          const topic = topics.value.get(topicId);
          if (topic) {
            topic.answerCount = Math.max((topic.answerCount || 1) - 1, 0);
          }
        }

        return true;
      } else {
        setError("Failed to delete answer");
        return false;
      }
    } catch (error) {
      console.error("Error deleting answer:", error);
      setError("Failed to delete answer");
      return false;
    }
  };

  // Search topics
  const searchTopics = async (searchTerm, options = {}) => {
    if (!searchTerm?.trim()) {
      searchResults.value = [];
      return [];
    }

    loadingSearch.value = true;
    clearError();

    try {
      const { category = null, limit = 20 } = options;

      const params = new URLSearchParams({
        q: searchTerm.trim(),
        limit: limit.toString(),
      });

      if (category) {
        params.append("category", category);
      }

      const response = await apiService.get(`/forum/search?${params}`);

      if (response.success && response.data) {
        const results = Array.isArray(response.data)
          ? response.data
          : response.data.topics || [];
        searchResults.value = results;
        return results;
      } else {
        setError("Failed to search topics");
        return [];
      }
    } catch (error) {
      console.error("Error searching topics:", error);
      setError("Failed to search topics");
      return [];
    } finally {
      loadingSearch.value = false;
    }
  };

  // Clear search results
  const clearSearch = () => {
    searchResults.value = [];
    loadingSearch.value = false;
  };

  // Clear all data (useful for logout)
  const clearAllData = () => {
    topics.value.clear();
    answers.value.clear();
    loadingStates.value.clear();
    loadingAnswers.value.clear();
    searchResults.value = [];
    loadingTopics.value = false;
    loadingSearch.value = false;
    error.value = null;
  };

  // Update answer count for a topic (used by components)
  const updateTopicAnswerCount = (topicId, newCount) => {
    const topic = topics.value.get(topicId);
    if (topic) {
      topic.answerCount = newCount;
    }
  };

  // Helper function to convert Firestore timestamps
  const convertTimestamps = (item) => {
    if (!item) return item;

    const converted = { ...item };

    // Convert common timestamp fields
    if (converted.createdAt && converted.createdAt._seconds) {
      converted.createdAt = new Date(converted.createdAt._seconds * 1000);
    }
    if (converted.updatedAt && converted.updatedAt._seconds) {
      converted.updatedAt = new Date(converted.updatedAt._seconds * 1000);
    }
    if (converted.editedAt && converted.editedAt._seconds) {
      converted.editedAt = new Date(converted.editedAt._seconds * 1000);
    }

    return converted;
  };

  return {
    // State
    loadingTopics,
    isCreatingTopic,
    loadingSearch,
    error,
    searchResults,

    // Getters
    getTopic,
    getTopicAnswers,
    isLoadingTopic,
    isLoadingTopicAnswers,
    getTopicsList,

    // Topics actions
    loadTopics,
    loadTopic,
    createTopic,
    updateTopic,
    deleteTopic,
    searchTopics,
    clearSearch,

    // Answers actions
    loadAnswers,
    createAnswer,
    updateAnswer,
    deleteAnswer,
    updateTopicAnswerCount,

    // Utility actions
    clearAllData,
    clearError,

    // Direct access for debugging
    topics: computed(() => topics.value),
    answers: computed(() => answers.value),
  };
});
