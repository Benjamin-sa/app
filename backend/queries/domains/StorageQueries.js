/**
 * Storage Queries
 * Handles all Firebase Storage operations
 */

const BaseFirebaseQueries = require("../base/BaseFirebaseQueries");

class StorageQueries extends BaseFirebaseQueries {
  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(buffer, filePath, metadata = {}) {
    const file = this.bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        ...metadata,
        cacheControl: "public, max-age=31536000", // 1 year cache
      },
      public: true,
    });

    // Get the public URL
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500", // Far future date for public access
    });

    return {
      url: url.split("?")[0], // Remove query parameters for cleaner URL
      storagePath: filePath,
    };
  }

  /**
   * Delete file from Firebase Storage
   */
  async deleteFile(storagePath) {
    const file = this.bucket.file(storagePath);
    return await file.delete();
  }
}

module.exports = StorageQueries;
