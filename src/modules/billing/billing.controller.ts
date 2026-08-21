import type { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse.ts";
import {
  createPaymentOrderService,
  processWebhookEventService,
  verifyOrderPaymentService,
  getUserPaymentHistoryService,
  getUserSubscriptionHistoryService,
} from "./billing.service.ts";
import { getUserEntitlements } from "./entitlement.service.ts";
import { createOrderSchema, orderIdParamSchema } from "./billing.validation.ts";

export const createOrder = async (req: Request, res: Response) => {
  if (!req.user) {
    return sendResponse(res, 401, {}, "Unauthorized");
  }

  const validation = createOrderSchema.safeParse(req.body);
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || "Invalid input data";
    return sendResponse(res, 400, {}, errorMessage);
  }

  const { planCode } = validation.data;
  const orderData = await createPaymentOrderService(req.user._id, planCode);

  return sendResponse(res, 201, { data: orderData }, "Payment order created successfully");
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = (req.headers["x-webhook-signature"] as string) || "";
    const timestamp = (req.headers["x-webhook-timestamp"] as string) || "";
    const rawBody = (req as any).rawBody || JSON.stringify(req.body || {});

    const result = await processWebhookEventService(
      rawBody,
      timestamp,
      signature,
      req.body
    );

    return res.status(200).json({ status: "OK", result });
  } catch (error: any) {
    console.error("[Webhook Handling Error]:", error);
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ error: error.message || "Webhook error" });
  }
};

export const verifyOrder = async (req: Request, res: Response) => {
  if (!req.user) {
    return sendResponse(res, 401, {}, "Unauthorized");
  }

  const validation = orderIdParamSchema.safeParse(req.params);
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || "Invalid order ID";
    return sendResponse(res, 400, {}, errorMessage);
  }

  const { orderId } = validation.data;
  const verificationResult = await verifyOrderPaymentService(req.user._id, orderId);

  return sendResponse(res, 200, { data: verificationResult }, "Order status verified successfully");
};

export const getCurrentBilling = async (req: Request, res: Response) => {
  if (!req.user) {
    return sendResponse(res, 401, {}, "Unauthorized");
  }

  const billingState = await getUserEntitlements(req.user._id);
  return sendResponse(res, 200, { data: billingState }, "Current billing state retrieved successfully");
};

export const getPayments = async (req: Request, res: Response) => {
  if (!req.user) {
    return sendResponse(res, 401, {}, "Unauthorized");
  }

  const payments = await getUserPaymentHistoryService(req.user._id);
  return sendResponse(res, 200, { data: payments }, "Payment history retrieved successfully");
};

export const getSubscriptions = async (req: Request, res: Response) => {
  if (!req.user) {
    return sendResponse(res, 401, {}, "Unauthorized");
  }

  const subscriptions = await getUserSubscriptionHistoryService(req.user._id);
  return sendResponse(res, 200, { data: subscriptions }, "Subscription history retrieved successfully");
};
