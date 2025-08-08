import firebaseQueries = require("../../queries/FirebaseQueries");
import { deleteImage } from "../../core/services/image.service"; // JS module
import {
  createBike as createBikeSchema,
  updateBike as updateBikeSchema,
  ValidationError,
  validateId,
  validatePaginationOptions,
  Bike,
} from "../../utils/validation.utils";

interface UploadedImage {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  [key: string]: any;
}

interface GetAllBikeOptions {
  page?: number;
  limit?: number;
  sort?: "recent" | "popular" | "featured";
  search?: string;
  engineSize?: string | number;
}

class BikeService {
  async getUserBikes(userId: string) {
    try {
      const validatedUserId = validateId(userId);
      return await (firebaseQueries as any).getBikesByUserId(validatedUserId);
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      throw new Error(
        `BIKE_SERVICE_ERROR: Failed to fetch user bikes - ${error.message}`
      );
    }
  }

  async getBikeById(bikeId: string, requestingUserId: string | null = null) {
    try {
      const validatedBikeId = validateId(bikeId);
      const bike = await (firebaseQueries as any).getBikeById(validatedBikeId);
      if (!bike || !bike.id) throw new Error("Bike not found");
      if (requestingUserId && requestingUserId !== bike.userId) {
        await (firebaseQueries as any).incrementBikeViews(validatedBikeId);
      }
      return bike;
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      throw new Error(
        `BIKE_SERVICE_ERROR: Failed to fetch bike - ${error.message}`
      );
    }
  }

  async createBike(
    userId: string,
    bikeData: any,
    images: UploadedImage[] = []
  ) {
    try {
      const validatedUserId = validateId(userId);
      const validatedBike = createBikeSchema({
        userId: validatedUserId,
        name: bikeData.name,
        brand: bikeData.brand,
        model: bikeData.model,
        year: bikeData.year ? Number(bikeData.year) : undefined,
        engine_size: bikeData.engine_size
          ? Number(bikeData.engine_size)
          : undefined,
        description: bikeData.description,
        photos: images || [],
        main_image: images.length > 0 ? images[0].url : "",
      }) as Bike & Record<string, any>;

      validatedBike.createdAt = new Date().toISOString();
      validatedBike.updatedAt = new Date().toISOString();

      const docRef = await (firebaseQueries as any).createBike(validatedBike);
      await this.updateUserBikeCount(validatedUserId);
      return { id: docRef.id, ...validatedBike };
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      throw new Error(
        `BIKE_SERVICE_ERROR: Failed to create bike - ${error.message}`
      );
    }
  }

  async updateBike(
    bikeId: string,
    userId: string,
    bikeData: any,
    newImages: UploadedImage[] = [],
    photosToDelete: string[] = []
  ) {
    try {
      const validatedBikeId = validateId(bikeId);
      const validatedUserId = validateId(userId);
      const existingBike = await (firebaseQueries as any).getBikeById(
        validatedBikeId
      );
      if (!existingBike || existingBike.isDeleted)
        throw new Error("Bike not found");
      if (existingBike.userId !== validatedUserId)
        throw new Error("Unauthorized: You can only edit your own bikes");

      if (photosToDelete?.length) {
        await Promise.all(
          photosToDelete.map(async (photoId) => {
            const photo = existingBike.photos?.find(
              (p: any) => p.id === photoId
            );
            if (photo) await deleteImage(photo);
          })
        );
      }

      const remainingPhotos = (existingBike.photos || []).filter(
        (p: any) => !photosToDelete.includes(p.id)
      );
      const allPhotos = [...remainingPhotos, ...newImages];

      const updateData = updateBikeSchema({
        name: bikeData.name,
        brand: bikeData.brand,
        model: bikeData.model,
        year: bikeData.year ? Number(bikeData.year) : undefined,
        engine_size: bikeData.engine_size
          ? Number(bikeData.engine_size)
          : undefined,
        description: bikeData.description,
        photos: allPhotos,
        main_image: allPhotos.length > 0 ? allPhotos[0].url : "",
      });

      await (firebaseQueries as any).updateBike(validatedBikeId, updateData);
      return { id: validatedBikeId, ...existingBike, ...updateData };
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      throw new Error(
        `BIKE_SERVICE_ERROR: Failed to update bike - ${error.message}`
      );
    }
  }

  async deleteBike(bikeId: string, userId: string) {
    try {
      const validatedBikeId = validateId(bikeId);
      const validatedUserId = validateId(userId);
      const bike = await (firebaseQueries as any).getBikeById(validatedBikeId);
      if (!bike) throw new Error("Bike not found");
      if (bike.userId !== validatedUserId)
        throw new Error("Unauthorized: You can only delete your own bikes");
      if (bike.isDeleted) throw new Error("Bike already deleted");
      await (firebaseQueries as any).deleteBike(validatedBikeId);
      await this.updateUserBikeCount(validatedUserId);
      return true;
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      throw new Error(
        `BIKE_SERVICE_ERROR: Failed to delete bike - ${error.message}`
      );
    }
  }

  async updateUserBikeCount(userId: string) {
    try {
      const validatedUserId = validateId(userId);
      const bikeCount = await (firebaseQueries as any).countBikesByUserId(
        validatedUserId
      );
      await (firebaseQueries as any).updateUserBikeCount(
        validatedUserId,
        bikeCount
      );
    } catch (error: any) {
      if (error instanceof ValidationError) {
        console.error(
          "Validation error updating user bike count:",
          error.message
        );
      } else {
        console.error("Error updating user bike count:", error.message);
      }
    }
  }

  async getFeaturedBikes(limit = 10) {
    try {
      // Clamp limit between 1 and 50 since TS validator lacks maxLimit option
      const safeLimit = Math.min(Math.max(limit, 1), 50);
      const bikes = await (firebaseQueries as any).getFeaturedBikes({
        limit: safeLimit,
      });
      return bikes;
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      throw new Error(
        `BIKE_SERVICE_ERROR: Failed to fetch featured bikes - ${error.message}`
      );
    }
  }

  async toggleFeaturedStatus(bikeId: string, userId: string) {
    try {
      const validatedBikeId = validateId(bikeId);
      const validatedUserId = validateId(userId);
      const bike = await (firebaseQueries as any).getBikeById(validatedBikeId);
      if (!bike) throw new Error("Bike not found");
      if (bike.userId !== validatedUserId)
        throw new Error("Unauthorized: You can only modify your own bikes");
      const newStatus = !bike.is_featured;
      await (firebaseQueries as any).toggleBikeFeaturedStatus(
        validatedBikeId,
        newStatus
      );
      return newStatus;
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      throw new Error(
        `BIKE_SERVICE_ERROR: Failed to toggle featured status - ${error.message}`
      );
    }
  }

  async getAllBikes(options: GetAllBikeOptions = {}) {
    try {
      const page = options.page && options.page > 0 ? options.page : 1;
      const limit = options.limit
        ? Math.min(Math.max(options.limit, 1), 50)
        : 12;
      const sort = options.sort || "recent";
      const search = options.search || "";
      const engineSize = options.engineSize || "";
      // validate basic pagination fields (only limit/offset supported in schema) - ignore result
      validatePaginationOptions({ limit });
      const result = await (firebaseQueries as any).getAllBikes({
        page,
        limit,
        sort,
        search,
        engineSize,
      });
      if (result.bikes)
        result.bikes = result.bikes.filter((b: any) => !b.isDeleted);
      return result;
    } catch (error: any) {
      if (error instanceof ValidationError)
        throw new Error(`BIKE_SERVICE_VALIDATION_ERROR: ${error.message}`);
      throw new Error(
        `BIKE_SERVICE_ERROR: Failed to fetch bikes - ${error.message}`
      );
    }
  }
}

const bikeService = new BikeService();
export default bikeService;
module.exports = bikeService;
