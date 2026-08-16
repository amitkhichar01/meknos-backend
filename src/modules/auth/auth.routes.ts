import { Router } from "express";
import { googleLogin, logout } from "./auth.controller.ts";

const router = Router();

router.post("/login/google", googleLogin);
router.post("/logout", logout);

export default router;
