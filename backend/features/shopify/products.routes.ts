import { Router } from "express";
import productsController from "./products.controller";

const router = Router();

router.get("/with-images", productsController.getProductsWithImages);
router.get("/search", productsController.searchProducts);
router.get("/collections", productsController.getAllCollections);
router.get("/collection/:id", productsController.getProductsByCollection);
router.get("/:id/with-images", productsController.getProductByIdWithImages);
router.get("/:id/variants", productsController.getProductVariants);

export default router;
module.exports = router;
