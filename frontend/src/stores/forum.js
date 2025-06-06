import { defineStore } from "pinia";
import { ref } from "vue";
import { apiService } from "@/services/api.service";

export const useForumStore = defineStore("forum", () => {
  // State - only for UI state, not data caching
  const loading = ref(false);
  const error = ref(null);

  // Actions - direct API calls without local caching
  const fetchTopics = async (
    page = 1,
    itemsPerPage = 10,
    search = "",
    category = ""
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiService.getTopics(
        page,
        itemsPerPage,
        search,
        category
      );

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        error.value = response.message;
        return { success: false, message: response.message };
      }
    } catch (err) {
      error.value = "Failed to fetch topics";
      console.error("Fetch topics error:", err);
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const fetchTopic = async (id) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiService.get(`/forum/topics/${id}`);

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        error.value = response.message;
        return { success: false, message: response.message };
      }
    } catch (err) {
      error.value = "Failed to fetch topic";
      console.error("Fetch topic error:", err);
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const uploadImages = async (formData, onProgress = null) => {
    try {
      const response = await apiService.post("/forum/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      });

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        error.value = response.message;
        return { success: false, message: response.message };
      }
    } catch (err) {
      error.value = "Failed to upload image";
      console.error("Upload image error:", err);
      return { success: false, message: error.value };
    }
  };

  const createTopic = async (topicData) => {
    loading.value = true;
    error.value = null;

    try {
      // Use direct API call instead of deprecated method
      const response = await apiService.post("/forum/topics", topicData);

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        error.value = response.message;
        return { success: false, message: response.message };
      }
    } catch (err) {
      error.value = "Failed to create topic";
      console.error("Create topic error:", err);
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const updateTopic = async (id, topicData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiService.updateTopic(id, topicData);

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        error.value = response.message;
        return { success: false, message: response.message };
      }
    } catch (err) {
      error.value = "Failed to update topic";
      console.error("Update topic error:", err);
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const deleteTopic = async (id) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiService.deleteTopic(id);

      if (response.success) {
        return { success: true };
      } else {
        error.value = response.message;
        return { success: false, message: response.message };
      }
    } catch (err) {
      error.value = "Failed to delete topic";
      console.error("Delete topic error:", err);
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const fetchAnswers = async (topicId, page = 1) => {
    try {
      const response = await apiService.get(
        `/forum/topics/${topicId}/answers?page=${page}`
      );

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        error.value = response.message;
        return { success: false, message: response.message };
      }
    } catch (err) {
      error.value = "Failed to fetch answers";
      console.error("Fetch answers error:", err);
      return { success: false, message: error.value };
    }
  };

  const createAnswer = async (topicId, answerData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiService.createAnswer(topicId, answerData);

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        error.value = response.message;
        return { success: false, message: response.message };
      }
    } catch (err) {
      error.value = "Failed to create answer";
      console.error("Create answer error:", err);
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const voteOnTopic = async (topicId, voteType) => {
    try {
      const response = await apiService.post(`/forum/topics/${topicId}/vote`, {
        voteType,
      });

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        error.value = response.message;
        return { success: false, message: response.message };
      }
    } catch (err) {
      error.value = "Failed to vote on topic";
      console.error("Vote topic error:", err);
      return { success: false, message: error.value };
    }
  };

  const voteOnAnswer = async (answerId, voteType) => {
    try {
      const response = await apiService.post(
        `/forum/answers/${answerId}/vote`,
        { voteType }
      );

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        error.value = response.message;
        return { success: false, message: response.message };
      }
    } catch (err) {
      error.value = "Failed to vote on answer";
      console.error("Vote answer error:", err);
      return { success: false, message: error.value };
    }
  };

  const deleteAnswer = async (answerId) => {
    try {
      const response = await apiService.delete(`/forum/answers/${answerId}`);

      if (response.success) {
        return { success: true };
      } else {
        error.value = response.message;
        return { success: false, message: response.message };
      }
    } catch (err) {
      error.value = "Failed to delete answer";
      console.error("Delete answer error:", err);
      return { success: false, message: error.value };
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    loading,
    error,

    // Actions
    fetchTopics,
    fetchTopic,
    createTopic,
    updateTopic,
    deleteTopic,
    fetchAnswers,
    createAnswer,
    voteOnTopic,
    voteOnAnswer,
    deleteAnswer,
    uploadImages, // Add this new method
    clearError,
  };
});
