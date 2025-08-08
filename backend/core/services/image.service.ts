import admin from "firebase-admin";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import path from "path";

interface ProcessedImagesMeta {
  width?: number;
  height?: number;
  format?: string;
  size: number;
}
interface UploadedImageRecord {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl: string;
  mediumUrl: string;
  size: number;
  width?: number;
  height?: number;
  mimeType: string;
  uploadedAt: string;
}

class ImageService {
  private bucket: any;
  private maxFileSize: number;
  private allowedFormats: string[];
  private thumbnailSize = { width: 300, height: 300 };
  private mediumSize = { width: 800, height: 600 };

  constructor() {
    this.bucket = admin.storage().bucket();
    this.maxFileSize = 5 * 1024 * 1024;
    this.allowedFormats = ["jpg", "jpeg", "png", "webp", "gif"];
  }

  private _validateImage(file: any) {
    const errors: string[] = [];
    if (file.size > this.maxFileSize)
      errors.push(
        `File size must be less than ${this.maxFileSize / (1024 * 1024)}MB`
      );
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    if (!this.allowedFormats.includes(ext))
      errors.push(
        `File format must be one of: ${this.allowedFormats.join(", ")}`
      );
    return { isValid: errors.length === 0, errors };
  }

  private async _processImage(buffer: Buffer, filename: string) {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
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
        } as ProcessedImagesMeta,
      };
    } catch (error: any) {
      throw new Error(
        `IMAGE_SERVICE_PROCESSING_ERROR: Image processing failed - ${error.message}`
      );
    }
  }

  private async _uploadToStorage(
    buffer: Buffer,
    filename: string,
    folder = "forum/images"
  ) {
    try {
      const fileId = uuidv4();
      const extension = ".webp";
      const storagePath = `${folder}/${fileId}${extension}`;
      const file = this.bucket.file(storagePath);
      await file.save(buffer, {
        metadata: {
          contentType: "image/webp",
          cacheControl: "public, max-age=31536000",
        },
        public: true,
      });
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: "03-01-2500",
      });
      return { fileId, url: url.split("?")[0], storagePath };
    } catch (error: any) {
      throw new Error(
        `IMAGE_SERVICE_UPLOAD_ERROR: Upload failed - ${error.message}`
      );
    }
  }

  async uploadImage(
    file: any,
    folder = "forum/images"
  ): Promise<UploadedImageRecord> {
    try {
      const validation = this._validateImage(file);
      if (!validation.isValid)
        throw new Error(
          `IMAGE_SERVICE_VALIDATION_ERROR: ${validation.errors.join(", ")}`
        );
      const processed = await this._processImage(
        file.buffer,
        file.originalname
      );
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
      return {
        id: originalUpload.fileId,
        filename: originalUpload.fileId + ".webp",
        originalName: file.originalname,
        url: originalUpload.url,
        thumbnailUrl: thumbnailUpload.url,
        mediumUrl: mediumUpload.url,
        size: processed.metadata.size,
        width: processed.metadata.width,
        height: processed.metadata.height,
        mimeType: "image/webp",
        uploadedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error.message?.startsWith("IMAGE_SERVICE_")) throw error;
      throw new Error(
        `IMAGE_SERVICE_ERROR: Image upload failed - ${error.message}`
      );
    }
  }

  async uploadImages(
    files: any | any[],
    folder = "forum/images"
  ): Promise<UploadedImageRecord[]> {
    try {
      const fileArray = Array.isArray(files) ? files : [files];
      const validFiles = fileArray.filter((f) => f && f.buffer);
      if (validFiles.length === 0)
        throw new Error(
          "IMAGE_SERVICE_VALIDATION_ERROR: No valid files provided"
        );
      return await Promise.all(
        validFiles.map((f) => this.uploadImage(f, folder))
      );
    } catch (error: any) {
      if (error.message?.startsWith("IMAGE_SERVICE_")) throw error;
      throw new Error(
        `IMAGE_SERVICE_ERROR: Image upload failed - ${error.message}`
      );
    }
  }

  async deleteImage(imageRecord: any) {
    try {
      if (!imageRecord)
        throw new Error(
          "IMAGE_SERVICE_VALIDATION_ERROR: Image record is required"
        );
      const deletePromises: Promise<any>[] = [];
      const originalPath = imageRecord.url
        ? this._extractStoragePathFromUrl(imageRecord.url)
        : null;
      if (originalPath)
        deletePromises.push(this.bucket.file(originalPath).delete());
      if (imageRecord.thumbnailUrl) {
        const p = this._extractStoragePathFromUrl(imageRecord.thumbnailUrl);
        if (p) deletePromises.push(this.bucket.file(p).delete());
      }
      if (imageRecord.mediumUrl) {
        const p = this._extractStoragePathFromUrl(imageRecord.mediumUrl);
        if (p) deletePromises.push(this.bucket.file(p).delete());
      }
      await Promise.allSettled(deletePromises);
      return true;
    } catch (error: any) {
      if (error.message?.startsWith("IMAGE_SERVICE_")) throw error;
      console.error("Error deleting image:", error);
      throw new Error(
        `IMAGE_SERVICE_ERROR: Failed to delete image - ${error.message}`
      );
    }
  }

  private _extractStoragePathFromUrl(url: string) {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
      return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
    } catch {
      return null;
    }
  }

  getImageUrl(
    imageRecord: any,
    size: "thumbnail" | "medium" | "original" = "medium"
  ) {
    if (!imageRecord)
      throw new Error(
        "IMAGE_SERVICE_VALIDATION_ERROR: Image record is required"
      );
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
  }

  getResponsiveImageData(imageRecord: any) {
    if (!imageRecord)
      throw new Error(
        "IMAGE_SERVICE_VALIDATION_ERROR: Image record is required"
      );
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
        original: { width: imageRecord.width, height: imageRecord.height },
      },
    };
  }
}

const imageService = new ImageService();
export const uploadImage = imageService.uploadImage.bind(imageService);
export const uploadImages = imageService.uploadImages.bind(imageService);
export const deleteImage = imageService.deleteImage.bind(imageService);
export const getImageUrl = imageService.getImageUrl.bind(imageService);
export const getResponsiveImageData =
  imageService.getResponsiveImageData.bind(imageService);
export default imageService;
module.exports = {
  uploadImage,
  uploadImages,
  deleteImage,
  getImageUrl,
  getResponsiveImageData,
};
