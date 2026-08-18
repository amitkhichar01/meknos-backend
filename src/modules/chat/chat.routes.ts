import { Router } from "express";
import { sendMessage, getChatHistory } from "./chat.controller.ts";
import ensureVisitorId from "#src/middlewares/visitor.middleware.ts";

const router = Router();

router.get("/:username/chat", ensureVisitorId, getChatHistory);
router.post("/:username/chat", ensureVisitorId, sendMessage);

export default router;
