// Shared image service types used across backend
export interface UploadedImageRecord {
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

export interface ImageUrls {
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
}
