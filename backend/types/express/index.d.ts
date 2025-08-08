import * as express from "express";

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
      imageData?: any;
      oldAvatar?: { url?: string; thumbnailUrl?: string } | null;
      newImageDetails?: {
        url?: string;
        thumbnailUrl?: string;
        mediumUrl?: string;
      } | null;
    }
  }
}

export {};
