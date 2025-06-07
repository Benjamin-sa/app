import { apiService } from "@/services/api.service";

class TopicService {
  // Fetch topics with pagination and filters
  async getTopics(page = 1, itemsPerPage = 10, search = "", category = "") {
    try {
      const response = await apiService.getTopics(
        page,
        itemsPerPage,
        search,
        category
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch topics:", error);
      return {
        success: false,
        message: error.response?.data?.error || "Failed to fetch topics",
      };
    }
  }

  // Fetch single topic by ID
  async getTopic(id) {
    try {
      const response = await apiService.get(`/forum/topics/${id}`);
      return response;
    } catch (error) {
      console.error("Failed to fetch topic:", error);
      return {
        success: false,
        message: error.response?.data?.error || "Failed to fetch topic",
      };
    }
  }

  // Create new topic
  async createTopic(topicData) {
    try {
      const response = await apiService.post("/forum/topics", topicData);
      return response;
    } catch (error) {
      console.error("Failed to create topic:", error);
      return {
        success: false,
        message: error.response?.data?.error || "Failed to create topic",
      };
    }
  }

  // Update existing topic
  async updateTopic(id, topicData) {
    try {
      const response = await apiService.updateTopic(id, topicData);
      return response;
    } catch (error) {
      console.error("Failed to update topic:", error);
      return {
        success: false,
        message: error.response?.data?.error || "Failed to update topic",
      };
    }
  }

  // Delete topic
  async deleteTopic(id) {
    try {
      const response = await apiService.deleteTopic(id);
      return response;
    } catch (error) {
      console.error("Failed to delete topic:", error);
      return {
        success: false,
        message: error.response?.data?.error || "Failed to delete topic",
      };
    }
  }

  // Vote on topic
  async voteOnTopic(topicId, voteType) {
    try {
      const response = await apiService.post(`/forum/topics/${topicId}/vote`, {
        voteType,
      });
      return response;
    } catch (error) {
      console.error("Failed to vote on topic:", error);
      return {
        success: false,
        message: error.response?.data?.error || "Failed to vote on topic",
      };
    }
  }

  // Fetch answers for a topic
  async getAnswers(topicId, page = 1) {
    try {
      const response = await apiService.get(
        `/forum/topics/${topicId}/answers?page=${page}`
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch answers:", error);
      return {
        success: false,
        message: error.response?.data?.error || "Failed to fetch answers",
      };
    }
  }

  // Create answer for topic
  async createAnswer(topicId, answerData) {
    try {
      const response = await apiService.createAnswer(topicId, answerData);
      return response;
    } catch (error) {
      console.error("Failed to create answer:", error);
      return {
        success: false,
        message: error.response?.data?.error || "Failed to create answer",
      };
    }
  }

  // Vote on answer
  async voteOnAnswer(answerId, voteType) {
    try {
      const response = await apiService.post(
        `/forum/answers/${answerId}/vote`,
        { voteType }
      );
      return response;
    } catch (error) {
      console.error("Failed to vote on answer:", error);
      return {
        success: false,
        message: error.response?.data?.error || "Failed to vote on answer",
      };
    }
  }

  // Delete answer
  async deleteAnswer(answerId) {
    try {
      const response = await apiService.delete(`/forum/answers/${answerId}`);
      return response;
    } catch (error) {
      console.error("Failed to delete answer:", error);
      return {
        success: false,
        message: error.response?.data?.error || "Failed to delete answer",
      };
    }
  }
}

export default new TopicService();
