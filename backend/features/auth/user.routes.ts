import express from "express";
import userController from "./user.controller";

const router = express.Router();

router.get("/profile/:uid", userController.getUserProfile);
router.get("/username/:username", userController.getUserByUsername);

export default router;
