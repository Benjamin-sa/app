import BaseController from "../../core/controller/base.controller";
import bikeService from "./bike.service";
import { Request } from "express";

class BikeController extends BaseController {
  constructor() {
    super("bike");
    this.getUserBikes = this.wrap(this._getUserBikes, {
      op: "Get User Bikes",
      map: (bikes) => ({ bikes, count: bikes.length }),
    });
    this.getBikeById = this.wrap(this._getBikeById, {
      op: "Get Bike By ID",
      map: (bike) => ({ bike }),
    });
    this.createBike = this.wrap(this._createBike, {
      status: 201,
      op: "Create Bike",
      map: (bike) => ({ bike }),
      message: "Bike created successfully",
    });
    this.updateBike = this.wrap(this._updateBike, {
      op: "Update Bike",
      map: (bike) => ({ bike }),
      message: "Bike updated successfully",
    });
    this.deleteBike = this.wrap(this._deleteBike, {
      op: "Delete Bike",
      message: "Bike deleted successfully",
    });
    this.getFeaturedBikes = this.wrap(this._getFeaturedBikes, {
      op: "Get Featured Bikes",
      map: (bikes) => ({ bikes, count: bikes.length }),
    });
    this.toggleFeaturedStatus = this.wrap(this._toggleFeaturedStatus, {
      op: "Toggle Featured Status",
      map: (is_featured) => ({ is_featured }),
      message: (res) =>
        `Bike ${
          res && (res as any).is_featured ? "featured" : "unfeatured"
        } successfully`,
    });
    this.getAllBikes = this.wrap(this._getAllBikes, { op: "Get All Bikes" });
  }

  private async _getUserBikes(req: Request) {
    const { userId } = req.params;
    return bikeService.getUserBikes(userId);
  }

  private async _getBikeById(req: Request) {
    const { bikeId } = req.params as { bikeId: string };
    const requestingUserId = (req as any).user?.uid || null;
    return bikeService.getBikeById(bikeId, requestingUserId);
  }

  private async _createBike(req: Request) {
    if (!(req as any).user) throw new Error("UNAUTHORIZED");
    const userId = (req as any).user.uid;
    const bikeData = req.body;
    const images = (req as any).imageData || [];
    const bike = await bikeService.createBike(userId, bikeData, images);
    await this.invalidateCache("bikes:*");
    await this.invalidateCache("featured_bikes:*");
    return bike;
  }

  private async _updateBike(req: Request) {
    if (!(req as any).user) throw new Error("UNAUTHORIZED");
    const { bikeId } = req.params as { bikeId: string };
    const userId = (req as any).user.uid;
    const bikeData = req.body;
    const newImages = (req as any).imageData || [];
    let photosToDelete: string[] = [];
    if ((req.body as any).photos_to_delete) {
      try {
        photosToDelete = JSON.parse((req.body as any).photos_to_delete);
      } catch {
        /* ignore */
      }
    }
    const bike = await bikeService.updateBike(
      bikeId,
      userId,
      bikeData,
      newImages,
      photosToDelete
    );
    await this.invalidateCache("bikes:*");
    await this.invalidateCache("featured_bikes:*");
    await this.deleteCache(`bike:${bikeId}`);
    return bike;
  }

  private async _deleteBike(req: Request) {
    if (!(req as any).user) throw new Error("UNAUTHORIZED");
    const { bikeId } = req.params as { bikeId: string };
    const userId = (req as any).user.uid;
    await bikeService.deleteBike(bikeId, userId);
    await this.invalidateCache("bikes:*");
    await this.invalidateCache("featured_bikes:*");
    await this.deleteCache(`bike:${bikeId}`);
    return null;
  }

  private async _getFeaturedBikes(req: Request) {
    const limit = parseInt(String(req.query.limit || "10"), 10) || 10;
    return this.getCachedData(
      `featured_bikes:${limit}`,
      () => bikeService.getFeaturedBikes(limit),
      600
    );
  }

  private async _toggleFeaturedStatus(req: Request) {
    if (!(req as any).user) throw new Error("UNAUTHORIZED");
    const { bikeId } = req.params as { bikeId: string };
    const userId = (req as any).user.uid;
    const isFeatured = await bikeService.toggleFeaturedStatus(bikeId, userId);
    await this.invalidateCache("featured_bikes:*");
    await this.deleteCache(`bike:${bikeId}`);
    return isFeatured;
  }

  private async _getAllBikes(req: Request) {
    const page = parseInt(String(req.query.page || "1"), 10) || 1;
    const limit = Math.min(
      parseInt(String(req.query.limit || "12"), 10) || 12,
      50
    );
    const sort = (req.query.sort as string) || "recent";
    const search = (req.query.search as string) || "";
    const engineSize = (req.query.engine_size as string) || "";
    const cacheKey = `bikes:${page}:${limit}:${sort}:${search}:${engineSize}`;
    const result = await this.getCachedData(
      cacheKey,
      () =>
        bikeService.getAllBikes({
          page,
          limit,
          sort: sort as any,
          search,
          engineSize,
        }),
      300
    );
    return {
      bikes: (result as any).bikes,
      hasMore: (result as any).hasMore,
      total: (result as any).total,
      page,
      limit,
    };
  }
}

export default new BikeController();
module.exports = new BikeController();
