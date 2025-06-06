import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle common responses
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("authToken");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // General HTTP methods - Use these for simple API calls
  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  async patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  // Authentication endpoints - Keep these as they handle special auth flows
  async login(credentials) {
    return this.client.post("/auth/login", credentials);
  }

  async register(userData) {
    return this.client.post("/auth/register", userData);
  }

  async syncUser(userData) {
    return this.client.post("/auth/sync", userData);
  }

  async logout() {
    return this.client.post("/auth/logout");
  }

  async getCurrentUser() {
    return this.client.get("/auth/me");
  }

  // Complex endpoints with query parameter handling - Keep these for convenience
  async getTopics(page = 1, limit = 10, search = "", category = "") {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category && { category }),
    });
    return this.client.get(`/forum/topics?${params}`);
  }

  async getAnswers(topicId, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.client.get(`/forum/topics/${topicId}/answers?${params}`);
  }

  async getProducts(page = 1, limit = 12, search = "", category = "") {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category && { category }),
    });
    return this.client.get(`/products?${params}`);
  }

  async getUserTopics(userId, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.client.get(`/users/${userId}/topics?${params}`);
  }

  async getUserAnswers(userId, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.client.get(`/users/${userId}/answers?${params}`);
  }

  // File upload - Keep this as it requires special handling
  async uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    return this.client.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  // Voting endpoints
  async vote(targetId, targetType, voteType) {
    return this.post("/forum/vote", {
      targetId,
      targetType,
      voteType,
    });
  }

  async getUserVote(targetId) {
    return this.get(`/forum/vote/${targetId}`);
  }

  // Deprecated methods - Use general HTTP methods instead
  // These are kept for backward compatibility but should be migrated

  /** @deprecated Use apiService.get(`/forum/topics/${id}`) instead */
  async getTopic(id) {
    return this.get(`/forum/topics/${id}`);
  }

  /** @deprecated Use apiService.post('/forum/topics', topicData) instead */
  async createTopic(topicData) {
    return this.post("/forum/topics", topicData);
  }

  /** @deprecated Use apiService.put(`/forum/topics/${id}`, topicData) instead */
  async updateTopic(id, topicData) {
    return this.put(`/forum/topics/${id}`, topicData);
  }

  /** @deprecated Use apiService.delete(`/forum/topics/${id}`) instead */
  async deleteTopic(id) {
    return this.delete(`/forum/topics/${id}`);
  }

  /** @deprecated Use apiService.post(`/forum/topics/${topicId}/answers`, answerData) instead */
  async createAnswer(topicId, answerData) {
    return this.post(`/forum/topics/${topicId}/answers`, answerData);
  }

  /** @deprecated Use apiService.put(`/forum/topics/${topicId}/answers/${answerId}`, answerData) instead */
  async updateAnswer(topicId, answerId, answerData) {
    return this.put(`/forum/topics/${topicId}/answers/${answerId}`, answerData);
  }

  /** @deprecated Use apiService.delete(`/forum/topics/${topicId}/answers/${answerId}`) instead */
  async deleteAnswer(topicId, answerId) {
    return this.delete(`/forum/topics/${topicId}/answers/${answerId}`);
  }

  /** @deprecated Use apiService.post(`/forum/topics/${topicId}/answers/${answerId}/vote`, { vote }) instead */
  async voteAnswer(topicId, answerId, vote) {
    return this.post(`/forum/topics/${topicId}/answers/${answerId}/vote`, {
      vote,
    });
  }

  /** @deprecated Use apiService.post(`/forum/topics/${topicId}/answers/${answerId}/best`) instead */
  async markBestAnswer(topicId, answerId) {
    return this.post(`/forum/topics/${topicId}/answers/${answerId}/best`);
  }

  /** @deprecated Use apiService.get(`/products/${id}`) instead */
  async getProduct(id) {
    return this.get(`/products/${id}`);
  }

  /** @deprecated Use apiService.get('/products/categories') instead */
  async getProductCategories() {
    return this.get("/products/categories");
  }

  /** @deprecated Use apiService.get(`/users/${userId}`) instead */
  async getUserProfile(userId) {
    return this.get(`/users/${userId}`);
  }

  /** @deprecated Use apiService.put(`/users/${userId}`, profileData) instead */
  async updateUserProfile(userId, profileData) {
    return this.put(`/users/${userId}`, profileData);
  }
}

const apiService = new ApiService();

export default apiService;
export { apiService };
