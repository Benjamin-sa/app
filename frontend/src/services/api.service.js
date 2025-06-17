import axios from "axios";
import authService from "@/services/auth.service";

// Automatisch detecteren van de juiste API URL
const getApiBaseUrl = () => {
  // In production (Heroku), gebruik same origin
  if (import.meta.env.PROD) {
    return "/api";
  }

  // Development mode
  const hostname = window.location.hostname;
  console.log("Current hostname:", hostname); // Debug log

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3000/api";
  } else {
    // Voor netwerk toegang gebruik het IP van de host
    return `http://${hostname}:3000/api`;
  }
};

// Gebruik altijd de dynamische detectie
const API_BASE_URL = getApiBaseUrl();
console.log("Final API_BASE_URL:", API_BASE_URL); // Debug log

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
