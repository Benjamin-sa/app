// Service-level Bike types

export interface UploadedImage {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  [key: string]: any;
}

export interface GetAllBikeOptions {
  page?: number;
  limit?: number;
  sort?: "recent" | "popular" | "featured";
  search?: string;
  engineSize?: string | number;
}
