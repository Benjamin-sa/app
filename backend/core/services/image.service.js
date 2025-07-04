/**
 * Image Service for Forum
 * Handles image uploads, optimization, and storage with Firebase Storage
 */

const admin = require("firebase-admin");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

class ImageService {
  constructor() {
    this.bucket = admin.storage().bucket();
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedFormats = ["jpg", "jpeg", "png", "webp", "gif"];
    this.thumbnailSize = { width: 300, height: 300 };
    this.mediumSize = { width: 800, height: 600 };
  }

  /**
   * Validate uploaded image file
   */
  _validateImage(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(
        `File size must be less than ${this.maxFileSize / (1024 * 1024)}MB`
      );
    }

    // Check file format
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    if (!this.allowedFormats.includes(ext)) {
      errors.push(
        `File format must be one of: ${this.allowedFormats.join(", ")}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Process and optimize image
   */
  async _processImage(buffer, filename) {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Generate optimized versions in WebP format
      const optimized = await image.webp({ quality: 85, effort: 4 }).toBuffer();

      const thumbnail = await image
        .resize(this.thumbnailSize.width, this.thumbnailSize.height, {
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      const medium = await image
        .resize(this.mediumSize.width, this.mediumSize.height, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85, effort: 4 })
        .toBuffer();

      return {
        original: optimized,
        thumbnail,
        medium,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: optimized.length,
        },
      };
    } catch (error) {
      throw new Error(
        `IMAGE_SERVICE_PROCESSING_ERROR: Image processing failed - ${error.message}`
      );
    }
  }

  /**
   * Upload image to Firebase Storage
   */
  async _uploadToStorage(buffer, filename, folder = "forum/images") {
    try {
      const fileId = uuidv4();
      const extension = ".webp"; // Changed to WebP
      const storagePath = `${folder}/${fileId}${extension}`;

      const file = this.bucket.file(storagePath);

      await file.save(buffer, {
        metadata: {
          contentType: "image/webp", // Changed to WebP MIME type
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
        fileId,
        url: url.split("?")[0], // Remove query parameters for cleaner URL
        storagePath,
      };
    } catch (error) {
      throw new Error(
        `IMAGE_SERVICE_UPLOAD_ERROR: Upload failed - ${error.message}`
      );
    }
  }

  /**
   * Upload single image with all optimizations
   */
  async uploadImage(file, folder = "forum/images") {
    try {
      // Validate image
      const validation = this._validateImage(file);
      if (!validation.isValid) {
        throw new Error(
          `IMAGE_SERVICE_VALIDATION_ERROR: ${validation.errors.join(", ")}`
        );
      }

      // Process image
      const processed = await this._processImage(
        file.buffer,
        file.originalname
      );

      // Upload all versions
      const [originalUpload, thumbnailUpload, mediumUpload] = await Promise.all(
        [
          this._uploadToStorage(processed.original, file.originalname, folder),
          this._uploadToStorage(
            processed.thumbnail,
            file.originalname,
            `${folder}/thumbnails`
          ),
          this._uploadToStorage(
            processed.medium,
            file.originalname,
            `${folder}/medium`
          ),
        ]
      );

      // Create image record
      const imageRecord = {
        id: originalUpload.fileId,
        filename: originalUpload.fileId + ".webp", // Changed to WebP extension
        originalName: file.originalname,
        url: originalUpload.url,
        thumbnailUrl: thumbnailUpload.url,
        mediumUrl: mediumUpload.url,
        size: processed.metadata.size,
        width: processed.metadata.width,
        height: processed.metadata.height,
        mimeType: "image/webp", // Changed to WebP MIME type
        uploadedAt: new Date().toISOString(), // Convert to ISO string instead of server timestamp
      };

      return imageRecord;
    } catch (error) {
      if (error.message.startsWith("IMAGE_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `IMAGE_SERVICE_ERROR: Image upload failed - ${error.message}`
      );
    }
  }

  /**
   * Upload single or multiple images with all optimizations
   */
  async uploadImages(files, folder = "forum/images") {
    try {
      // Ensure files is always an array
      const fileArray = Array.isArray(files) ? files : [files];

      // Filter out any undefined/null files
      const validFiles = fileArray.filter((file) => file && file.buffer);

      if (validFiles.length === 0) {
        throw new Error(
          "IMAGE_SERVICE_VALIDATION_ERROR: No valid files provided"
        );
      }

      // Upload all files
      const uploads = validFiles.map((file) => this.uploadImage(file, folder));
      const results = await Promise.all(uploads);

      return results;
    } catch (error) {
      if (error.message.startsWith("IMAGE_SERVICE_")) {
        throw error;
      }
      throw new Error(
        `IMAGE_SERVICE_ERROR: Image upload failed - ${error.message}`
      );
    }
  }

  /**
   * Delete image from storage
   */
  async deleteImage(imageRecord) {
    try {
      if (!imageRecord) {
        throw new Error(
          "IMAGE_SERVICE_VALIDATION_ERROR: Image record is required"
        );
      }

      const deletePromises = [];

      // Extract file paths from URLs and delete each version
      if (imageRecord.url) {
        const originalPath = this._extractStoragePathFromUrl(imageRecord.url);
        if (originalPath) {
          deletePromises.push(this.bucket.file(originalPath).delete());
        }
      }

      if (imageRecord.thumbnailUrl) {
        const thumbnailPath = this._extractStoragePathFromUrl(
          imageRecord.thumbnailUrl
        );
        if (thumbnailPath) {
          deletePromises.push(this.bucket.file(thumbnailPath).delete());
        }
      }

      if (imageRecord.mediumUrl) {
        const mediumPath = this._extractStoragePathFromUrl(
          imageRecord.mediumUrl
        );
        if (mediumPath) {
          deletePromises.push(this.bucket.file(mediumPath).delete());
        }
      }

      await Promise.allSettled(deletePromises); // Use allSettled to not fail if some files don't exist

      return true;
    } catch (error) {
      if (error.message.startsWith("IMAGE_SERVICE_")) {
        throw error;
      }
      console.error("Error deleting image:", error);
      throw new Error(
        `IMAGE_SERVICE_ERROR: Failed to delete image - ${error.message}`
      );
    }
  }

  /**
   * Extract storage path from Firebase Storage URL
   */
  _extractStoragePathFromUrl(url) {
    try {
      // Handle both signed URLs and public URLs
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
      if (pathMatch) {
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch (error) {
      console.error("Error extracting path from URL:", error);
      return null;
    }
  }

  /**
   * Get optimized image URLs based on size preference
   */
  getImageUrl(imageRecord, size = "medium") {
    try {
      if (!imageRecord) {
        throw new Error(
          "IMAGE_SERVICE_VALIDATION_ERROR: Image record is required"
        );
      }

      switch (size) {
        case "thumbnail":
          return imageRecord.thumbnailUrl;
        case "medium":
          return imageRecord.mediumUrl;
        case "original":
          return imageRecord.url;
        default:
          return imageRecord.mediumUrl;
      }
    } catch (error) {
      throw new Error(
        `IMAGE_SERVICE_ERROR: Failed to get image URL - ${error.message}`
      );
    }
  }

  /**
   * Generate responsive image data for frontend
   */
  getResponsiveImageData(imageRecord) {
    try {
      if (!imageRecord) {
        throw new Error(
          "IMAGE_SERVICE_VALIDATION_ERROR: Image record is required"
        );
      }

      return {
        id: imageRecord.id,
        alt: imageRecord.originalName,
        src: imageRecord.url,
        srcSet: {
          thumbnail: imageRecord.thumbnailUrl,
          medium: imageRecord.mediumUrl,
          original: imageRecord.url,
        },
        sizes: {
          thumbnail: this.thumbnailSize,
          medium: this.mediumSize,
          original: {
            width: imageRecord.width,
            height: imageRecord.height,
          },
        },
      };
    } catch (error) {
      throw new Error(
        `IMAGE_SERVICE_ERROR: Failed to generate responsive image data - ${error.message}`
      );
    }
  }
}

const imageService = new ImageService();

module.exports = {
  uploadImage: imageService.uploadImage.bind(imageService),
  uploadImages: imageService.uploadImages.bind(imageService),
  deleteImage: imageService.deleteImage.bind(imageService),
  getImageUrl: imageService.getImageUrl.bind(imageService),
  getResponsiveImageData:
    imageService.getResponsiveImageData.bind(imageService),
};
