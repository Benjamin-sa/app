import axios from "axios";
import authService from "@/services/auth.service";

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

    // Request interceptor to add auth token from Firebase
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const firebaseUser = await authService.getCurrentUser();
          if (firebaseUser) {
            const token = await firebaseUser.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error("Error getting Firebase token:", error);
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
          // Token expired or invalid - let Firebase handle this
          console.log("401 error - redirecting to login");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // General HTTP methods
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

  // Specific API endpoints
  async getCurrentUserFromApi() {
    return this.client.get("/auth/me");
  }

  async getTopics(page = 1, limit = 10, search = "", category = "") {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category && { category }),
    });
    return this.client.get(`/forum/topics?${params}`);
  }
}

const apiService = new ApiService();

export default apiService;
export { apiService };
