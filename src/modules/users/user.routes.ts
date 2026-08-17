import { Router } from "express";
import { getMe } from "./user.controller.ts";
import authenticate from "#src/middlewares/authenticate.middleware.ts";

const router = Router();

router.get("/me", authenticate, getMe);

export default router;
