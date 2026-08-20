import { Router } from "express";
import {
  createProfile,
  getOwnerProfile,
  getPublicProfile,
  updateProfile,
} from "./userProfile.controller.ts";
import authenticate from "../../middlewares/authenticate.middleware.ts";

const router = Router();

// Owner routes (requires authentication)
router.post("/", authenticate, createProfile);
router.get("/me", authenticate, getOwnerProfile);
router.patch("/me", authenticate, updateProfile);

// Public route
router.get("/public/:username", getPublicProfile);

export default router;
