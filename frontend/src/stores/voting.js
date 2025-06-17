import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { apiService } from "@/services/api.service";

export const useVotingStore = defineStore("voting", () => {
  // State
  const votes = ref(new Map()); // Map<entityId, voteData>
  const loading = ref(new Map()); // Map<entityId, boolean>
  const error = ref(null);

  // Getters
  const getVoteData = computed(() => (entityId, entityType) => {
    const key = `${entityType}_${entityId}`;
    return (
      votes.value.get(key) || {
        upvotes: 0,
        downvotes: 0,
        userVote: null, // 'up', 'down', or null
        netVotes: 0,
      }
    );
  });

  const isLoading = computed(() => (entityId, entityType) => {
    const key = `${entityType}_${entityId}`;
    return loading.value.get(key) || false;
  });

  const getUserVote = computed(() => (entityId, entityType) => {
    const voteData = getVoteData.value(entityId, entityType);
    return voteData.userVote;
  });

  const getNetVotes = computed(() => (entityId, entityType) => {
    const voteData = getVoteData.value(entityId, entityType);
    return voteData.netVotes || voteData.upvotes - voteData.downvotes;
  });

  // Actions
  const setLoading = (entityId, entityType, isLoading) => {
    const key = `${entityType}_${entityId}`;
    if (isLoading) {
      loading.value.set(key, true);
    } else {
      loading.value.delete(key);
    }
  };

  const setError = (errorMessage) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  // Load vote data for an entity
  const loadVotes = async (entityId, entityType) => {
    if (!entityId || !entityType) return null;

    const key = `${entityType}_${entityId}`;
    setLoading(entityId, entityType, true);
    clearError();

    try {
      const response = await apiService.get(`/votes/${entityId}/${entityType}`);

      if (response.success && response.data) {
        const voteData = {
          upvotes: response.data.upvotes || 0,
          downvotes: response.data.downvotes || 0,
          userVote: response.data.userVote || null,
          netVotes:
            response.data.netVotes ||
            response.data.upvotes - response.data.downvotes,
        };

        votes.value.set(key, voteData);
        return voteData;
      } else {
        setError("Failed to load vote data");
        return null;
      }
    } catch (error) {
      console.error("Error loading votes:", error);
      setError("Failed to load vote data");
      return null;
    } finally {
      setLoading(entityId, entityType, false);
    }
  };

  // Cast a vote (up or down)
  const castVote = async (entityId, entityType, voteType) => {
    if (!entityId || !entityType || !["up", "down"].includes(voteType)) {
      setError("Invalid vote parameters");
      return false;
    }

    const key = `${entityType}_${entityId}`;
    setLoading(entityId, entityType, true);
    clearError();

    try {
      const response = await apiService.post("/votes", {
        targetId: entityId,
        targetType: entityType,
        voteType,
      });

      if (response.success && response.data) {
        const voteData = {
          upvotes: response.data.upvotes || 0,
          downvotes: response.data.downvotes || 0,
          userVote: response.data.userVote || null,
          netVotes:
            response.data.netVotes ||
            response.data.upvotes - response.data.downvotes,
        };

        votes.value.set(key, voteData);
        return voteData;
      } else {
        setError("Failed to cast vote");
        return false;
      }
    } catch (error) {
      console.error("Error casting vote:", error);
      setError("Failed to cast vote");
      return false;
    } finally {
      setLoading(entityId, entityType, false);
    }
  };

  // Remove a vote (toggle off)
  const removeVote = async (entityId, entityType) => {
    if (!entityId || !entityType) {
      setError("Invalid parameters");
      return false;
    }

    const key = `${entityType}_${entityId}`;
    setLoading(entityId, entityType, true);
    clearError();

    try {
      const response = await apiService.delete(
        `/votes/${entityId}/${entityType}`
      );

      if (response.success && response.data) {
        const voteData = {
          upvotes: response.data.upvotes || 0,
          downvotes: response.data.downvotes || 0,
          userVote: null,
          netVotes:
            response.data.netVotes ||
            response.data.upvotes - response.data.downvotes,
        };

        votes.value.set(key, voteData);
        return voteData;
      } else {
        setError("Failed to remove vote");
        return false;
      }
    } catch (error) {
      console.error("Error removing vote:", error);
      setError("Failed to remove vote");
      return false;
    } finally {
      setLoading(entityId, entityType, false);
    }
  };

  // Toggle vote (handles up/down/remove logic)
  const toggleVote = async (entityId, entityType, voteType) => {
    const currentVote = getUserVote.value(entityId, entityType);

    if (currentVote === voteType) {
      // Same vote type - remove it
      return await removeVote(entityId, entityType);
    } else {
      // Different vote type or no vote - cast new vote
      return await castVote(entityId, entityType, voteType);
    }
  };

  // Batch load votes for multiple entities
  const loadBatchVotes = async (entities) => {
    if (!Array.isArray(entities) || entities.length === 0) return {};

    clearError();

    try {
      const response = await apiService.post("/votes/batch", { entities });

      if (response.success && response.data) {
        const batchResults = {};

        // Store each vote data result
        Object.entries(response.data).forEach(([entityKey, voteData]) => {
          const voteInfo = {
            upvotes: voteData.upvotes || 0,
            downvotes: voteData.downvotes || 0,
            userVote: voteData.userVote || null,
            netVotes:
              voteData.netVotes || voteData.upvotes - voteData.downvotes,
          };

          votes.value.set(entityKey, voteInfo);
          batchResults[entityKey] = voteInfo;
        });

        return batchResults;
      } else {
        setError("Failed to load batch votes");
        return {};
      }
    } catch (error) {
      console.error("Error loading batch votes:", error);
      setError("Failed to load batch votes");
      return {};
    }
  };

  // Update vote data locally (for optimistic updates)
  const updateVoteData = (entityId, entityType, voteData) => {
    const key = `${entityType}_${entityId}`;
    votes.value.set(key, {
      upvotes: voteData.upvotes || 0,
      downvotes: voteData.downvotes || 0,
      userVote: voteData.userVote || null,
      netVotes: voteData.netVotes || voteData.upvotes - voteData.downvotes,
    });
  };

  // Clear vote data for an entity
  const clearVoteData = (entityId, entityType) => {
    const key = `${entityType}_${entityId}`;
    votes.value.delete(key);
    loading.value.delete(key);
  };

  // Clear all vote data (useful for logout)
  const clearAllVotes = () => {
    votes.value.clear();
    loading.value.clear();
    error.value = null;
  };

  return {
    // State
    error,

    // Getters
    getVoteData,
    isLoading,
    getUserVote,
    getNetVotes,

    // Actions
    loadVotes,
    castVote,
    removeVote,
    toggleVote,
    loadBatchVotes,
    updateVoteData,
    clearVoteData,
    clearAllVotes,
    clearError,

    // Direct access for debugging
    votes: computed(() => votes.value),
    loadingStates: computed(() => loading.value),
  };
});
