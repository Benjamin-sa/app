import multer from "multer";
import * as imageService from "../services/image.service";
import { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();

export const FOLDERS = {
  TOPICS: "forum/topics",
  ANSWERS: "forum/answers",
  AVATARS: "forum/avatars",
  BIKES: "bikes",
};

const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else
    cb(
      new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.")
    );
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});
export const uploadMultiple = upload.array("images", 5);

export const handleUploadError = (
  error: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE")
      return res
        .status(400)
        .json({
          error: "File too large",
          message: "File size must be less than 5MB",
        });
    if (error.code === "LIMIT_FILE_COUNT")
      return res
        .status(400)
        .json({
          error: "Too many files",
          message: "Maximum 5 files allowed per request",
        });
    if (error.code === "LIMIT_UNEXPECTED_FILE")
      return res
        .status(400)
        .json({
          error: "Unexpected field",
          message: "Unexpected file field in request",
        });
  }
  if (error.message?.includes("Invalid file type"))
    return res
      .status(400)
      .json({ error: "Invalid file type", message: error.message });
  return next(error);
};

export const processImages = (folder = "forum/images") => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      if (req.file) {
        const uploadedImage = await imageService.uploadImages(req.file, folder);
        req.imageData = uploadedImage;
        delete req.file;
        return next();
      }
      if (!req.files || req.files.length === 0) {
        req.imageData = [];
        return next();
      }
      const uploadedImages = await imageService.uploadImages(req.files, folder);
      req.imageData = uploadedImages;
      delete req.files;
      next();
    } catch (error: any) {
      return res
        .status(400)
        .json({
          error: "Image processing failed",
          message: error.message?.includes("IMAGE_SERVICE_")
            ? error.message.split("IMAGE_SERVICE_")[1].split(":")[1].trim()
            : "Failed to process uploaded images",
        });
    }
  };
};

export { upload };
module.exports = {
  upload,
  uploadMultiple,
  handleUploadError,
  processImages,
  FOLDERS,
};
