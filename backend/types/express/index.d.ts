import * as express from "express";
import type { ImageUrls, UploadedImageRecord } from "..";

declare global {
  namespace Express {
    interface UserAuthInfo {
      uid: string;
      email?: string;
      emailVerified?: boolean;
      displayName?: string;
      picture?: string;
      firebase?: any;
    }

    interface Request {
      user?: UserAuthInfo | null;
      imageData?: UploadedImageRecord | UploadedImageRecord[] | null;
      // Avoid leaking controller-specific fields onto Request; pass via service returns instead
    }
  }
}

export {};
