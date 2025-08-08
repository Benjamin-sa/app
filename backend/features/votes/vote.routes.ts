import { Router } from "express";
import { authenticate, identify } from "../../core/middleware/auth.middleware";
import votingController from "./voting.controller";

const router = Router();

router.post("/", authenticate, votingController.vote);
router.get("/:targetId/:targetType", identify, votingController.getVote);

export default router;
module.exports = router;
