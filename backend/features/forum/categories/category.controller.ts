import BaseController from "../../../core/controller/base.controller";
import categoryService from "./category.service";
import { Request, Response } from "express";

class CategoryController extends BaseController {
  constructor() {
    super("CATEGORY");
  }

  async getCategories(req: Request, res: Response) {
    try {
      const cacheKey = "categories_with_stats";
      const categories = await this.getCachedData(
        cacheKey,
        () => categoryService.getCategoriesWithStats(),
        300
      );
      this.sendSuccess(res, categories);
    } catch (e) {
      this.handleError(res, e, "Get Categories");
    }
  }

  async getCategoryStats(req: Request, res: Response) {
    try {
      const { categoryId } = req.params as any;
      const cacheKey = `category_stats:${categoryId}`;
      const stats = await this.getCachedData(
        cacheKey,
        () => categoryService.getCategoryStatistics(categoryId),
        180
      );
      this.sendSuccess(res, stats);
    } catch (e) {
      this.handleError(res, e, "Get Category Stats");
    }
  }

  async refreshStats(req: Request, res: Response) {
    try {
      await categoryService.refreshAllCategoryStatistics();
      await this.invalidateCache("categories_with_stats");
      await this.invalidateCache("category_stats:*");
      this.sendSuccess(res, {
        message: "Category statistics refreshed successfully",
      });
    } catch (e) {
      this.handleError(res, e, "Refresh Category Stats");
    }
  }
}

const categoryController = new CategoryController();
export default categoryController;
module.exports = categoryController;
