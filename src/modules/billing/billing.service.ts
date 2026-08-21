import crypto from "node:crypto";
import type { Types } from "mongoose";
import Plan from "./plan.model.ts";
import Payment from "./payment.model.ts";
import Subscription from "./subscription.model.ts";
import WebhookEvent from "./webhookEvent.model.ts";
import User from "../users/user.model.ts";
import { env } from "../../config/env.config.ts";
import {
  createCashfreeOrder,
  getCashfreeOrder,
  verifyWebhookSignature,
} from "./cashfree.service.ts";
import { getActiveSubscription } from "./entitlement.service.ts";
import type { ICashfreeWebhookPayload } from "./billing.types.ts";

/**
 * Calculates 1 calendar month expiry date from a given start date.
 */
const calculateOneMonthExpiry = (startDate: Date): Date => {
  const expiry = new Date(startDate);
  expiry.setMonth(expiry.getMonth() + 1);
  return expiry;
};

/**
 * Creates a Cashfree payment order for the specified plan code.
 */
export const createPaymentOrderService = async (
  userId: string | Types.ObjectId,
  planCode: string
) => {
  // 1. Check if user already has an active Pro subscription
  const activeSub = await getActiveSubscription(userId);
  if (activeSub) {
    const error: any = new Error("You already have an active Pro subscription.");
    error.statusCode = 400;
    throw error;
  }

  // 2. Fetch active Plan from database using server-side pricing
  const plan = await Plan.findOne({
    code: planCode.toLowerCase().trim(),
    isActive: true,
  });

  if (!plan) {
    const error: any = new Error("Requested plan is invalid or inactive.");
    error.statusCode = 404;
    throw error;
  }

  if (plan.code === "free" || plan.price <= 0) {
    const error: any = new Error("Free plan cannot be purchased.");
    error.statusCode = 400;
    throw error;
  }

  // 3. Find user details for Cashfree customer details
  const user = await User.findById(userId).lean();
  if (!user) {
    const error: any = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  // 4. Generate unique order ID compatible with Cashfree
  const orderId = `order_${crypto.randomUUID()}`;

  // 5. Create order in Cashfree
  const returnUrl = `${env.FRONTEND_URL}/billing/verify?order_id={order_id}`;
  const cashfreeOrderPayload = {
    order_id: orderId,
    order_amount: plan.price,
    order_currency: plan.currency,
    customer_details: {
      customer_id: user._id.toString(),
      customer_name: user.fullName || "Meknos User",
      customer_email: user.email,
      customer_phone: "9999999999",
    },
    order_meta: {
      return_url: returnUrl,
    },
  };

  const cfResponse = await createCashfreeOrder(cashfreeOrderPayload);

  // 6. Save PENDING Payment record in DB
  const payment = await Payment.create({
    userId: user._id,
    planId: plan._id,
    planCode: plan.code,
    planVersion: plan.version,
    provider: "cashfree",
    orderId,
    amount: plan.price,
    currency: plan.currency,
    status: "PENDING",
  });

  return {
    orderId: payment.orderId,
    paymentSessionId: cfResponse.payment_session_id,
    amount: payment.amount,
    currency: payment.currency,
    planName: plan.name,
  };
};

/**
 * Handles Cashfree webhook events idempotently and creates Subscription upon success.
 */
export const processWebhookEventService = async (
  rawBody: string,
  timestamp: string,
  signature: string,
  payload: ICashfreeWebhookPayload
) => {
  // 1. Verify webhook signature
  const isValidSignature = verifyWebhookSignature(rawBody, timestamp, signature);
  if (!isValidSignature) {
    const error: any = new Error("Invalid Cashfree webhook signature.");
    error.statusCode = 401;
    throw error;
  }

  const data = payload?.data;
  const orderId = data?.order?.order_id;
  const cfPaymentId = data?.payment?.cf_payment_id
    ? String(data.payment.cf_payment_id)
    : undefined;
  const paymentStatus = data?.payment?.payment_status?.toUpperCase() || "PENDING";
  const eventId =
    cfPaymentId || `${orderId}_${payload.event_time || Date.now()}`;

  if (!orderId) {
    return { status: "IGNORED", reason: "Missing order_id" };
  }

  // 2. Check event idempotency
  const existingEvent = await WebhookEvent.findOne({ eventId });
  if (existingEvent) {
    return { status: "IDEMPOTENT", message: "Event already processed" };
  }

  // 3. Find matching Payment record
  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    return { status: "FAILED", reason: "Payment record not found for orderId" };
  }

  // Record WebhookEvent for audit trail
  await WebhookEvent.create({
    eventId,
    eventType: payload.type || "PAYMENT_WEBHOOK",
    orderId,
  });

  // 4. Handle Payment Success
  if (paymentStatus === "SUCCESS" || payload.type === "PAYMENT_SUCCESS_WEBHOOK") {
    if (payment.status === "SUCCESS") {
      return { status: "IDEMPOTENT", message: "Payment already marked successful" };
    }

    const paidAt = data?.payment?.payment_time
      ? new Date(data.payment.payment_time)
      : new Date();

    payment.status = "SUCCESS";
    if (cfPaymentId) payment.cfPaymentId = cfPaymentId;
    if (data?.payment?.payment_method) {
      payment.paymentMethod =
        typeof data.payment.payment_method === "string"
          ? data.payment.payment_method
          : JSON.stringify(data.payment.payment_method);
    }
    if (data?.payment?.payment_group) payment.paymentGroup = data.payment.payment_group;
    if (data?.payment?.payment_message) payment.paymentMessage = data.payment.payment_message;
    if (data?.payment?.bank_reference) payment.bankReference = data.payment.bank_reference;
    payment.paidAt = paidAt;
    await payment.save();

    // Load current Plan snapshot
    const plan = await Plan.findById(payment.planId);
    if (!plan) {
      throw new Error(`Plan associated with payment ${payment._id} not found.`);
    }

    const startedAt = paidAt;
    const expiresAt = calculateOneMonthExpiry(startedAt);

    // Create Subscription entitlement snapshot
    await Subscription.create({
      userId: payment.userId,
      planId: plan._id,
      planCode: plan.code,
      planVersion: plan.version,
      price: payment.amount,
      currency: payment.currency,
      duration: plan.duration || "monthly",
      entitlements: {
        features: plan.features,
        limits: plan.limits,
      },
      paymentId: payment._id,
      provider: "cashfree",
      startedAt,
      expiresAt,
      status: "ACTIVE",
    });

    return { status: "SUCCESS", message: "Subscription activated successfully" };
  }

  // 5. Handle Payment Failure or User Dropped
  if (
    paymentStatus === "FAILED" ||
    paymentStatus === "USER_DROPPED" ||
    paymentStatus === "CANCELLED"
  ) {
    payment.status = paymentStatus as any;
    payment.failureReason = data?.payment?.payment_message || "Payment failed or cancelled";
    await payment.save();

    return { status: paymentStatus, message: "Payment status recorded" };
  }

  return { status: "PENDING", message: "Payment state pending" };
};

/**
 * Manually verifies order payment status with Cashfree if frontend redirects back.
 */
export const verifyOrderPaymentService = async (
  userId: string | Types.ObjectId,
  orderId: string
) => {
  const payment = await Payment.findOne({ orderId, userId });
  if (!payment) {
    const error: any = new Error("Payment record not found.");
    error.statusCode = 404;
    throw error;
  }

  if (payment.status === "SUCCESS") {
    const activeSub = await Subscription.findOne({ paymentId: payment._id });
    return {
      status: "SUCCESS",
      payment,
      subscription: activeSub,
    };
  }

  // Fetch status from Cashfree REST API
  const cfOrder = await getCashfreeOrder(orderId);

  if (cfOrder.order_status === "PAID") {
    const plan = await Plan.findById(payment.planId);
    if (plan) {
      payment.status = "SUCCESS";
      payment.paidAt = new Date();
      await payment.save();

      const startedAt = new Date();
      const expiresAt = calculateOneMonthExpiry(startedAt);

      const existingSub = await Subscription.findOne({ paymentId: payment._id });
      let subscription = existingSub;

      if (!existingSub) {
        subscription = await Subscription.create({
          userId: payment.userId,
          planId: plan._id,
          planCode: plan.code,
          planVersion: plan.version,
          price: payment.amount,
          currency: payment.currency,
          duration: plan.duration || "monthly",
          entitlements: {
            features: plan.features,
            limits: plan.limits,
          },
          paymentId: payment._id,
          provider: "cashfree",
          startedAt,
          expiresAt,
          status: "ACTIVE",
        });
      }

      return {
        status: "SUCCESS",
        payment,
        subscription,
      };
    }
  }

  return {
    status: payment.status,
    orderStatus: cfOrder.order_status,
    payment,
  };
};

/**
 * Retrieves payment history for the authenticated user.
 */
export const getUserPaymentHistoryService = async (
  userId: string | Types.ObjectId
) => {
  return Payment.find({ userId })
    .sort({ createdAt: -1 })
    .populate("planId", "name code version")
    .lean();
};

/**
 * Retrieves subscription history for the authenticated user.
 */
export const getUserSubscriptionHistoryService = async (
  userId: string | Types.ObjectId
) => {
  return Subscription.find({ userId })
    .sort({ createdAt: -1 })
    .populate("planId", "name code version")
    .lean();
};
