import { Router } from "express";
import authenticate from "../../middlewares/authenticate.middleware.ts";
import {
  createOrder,
  handleWebhook,
  verifyOrder,
  getCurrentBilling,
  getPayments,
  getSubscriptions,
} from "./billing.controller.ts";

const router = Router();

// Public webhook route (DO NOT put authenticate middleware here)
router.post("/webhook", handleWebhook);

// Authenticated billing routes
router.post("/create-order", authenticate, createOrder);
router.get("/verify-order/:orderId", authenticate, verifyOrder);
router.get("/current", authenticate, getCurrentBilling);
router.get("/payments", authenticate, getPayments);
router.get("/subscriptions", authenticate, getSubscriptions);

export default router;
