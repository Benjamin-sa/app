import { apiService } from "@/services/api.service";

class ForumService {
  // Upload images with progress tracking - simplified
  async uploadImages(formData, onProgress = null) {
    const response = await apiService.post("/forum/upload/images", formData, {
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
    return response;
  }

  // Get forum statistics - simplified
  async getForumStats() {
    const response = await apiService.get("/forum/stats");
    return response;
  }

  // Get forum categories - simplified
  async getCategories() {
    const response = await apiService.get("/forum/categories");
    return response;
  }
}

export default new ForumService();
