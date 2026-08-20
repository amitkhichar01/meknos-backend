import { Router } from "express";
import { googleLogin, logout, getMe } from "./auth.controller.ts";
import authenticate from "../../middlewares/authenticate.middleware.ts";

const router = Router();

router.post("/login/google", googleLogin);
router.get("/me", authenticate, getMe);
router.post("/logout", logout);

export default router;
