import crypto from "crypto";
import axios from "axios";
import { env } from "../../config/env.config.ts";
import type {
  ICashfreeCreateOrderRequest,
  ICashfreeOrderResponse,
} from "./billing.types.ts";

const getBaseUrl = (): string => {
  if (env.CASHFREE_ENVIRONMENT === "PRODUCTION") {
    return "https://api.cashfree.com/pg";
  }
  return "https://sandbox.cashfree.com/pg";
};

const getHeaders = () => {
  return {
    "Content-Type": "application/json",
    "x-client-id": env.CASHFREE_APP_ID,
    "x-client-secret": env.CASHFREE_SECRET_KEY,
    "x-api-version": env.CASHFREE_API_VERSION,
  };
};

/**
 * Creates an order in Cashfree Payment Gateway.
 */
export const createCashfreeOrder = async (
  payload: ICashfreeCreateOrderRequest
): Promise<ICashfreeOrderResponse> => {
  const url = `${getBaseUrl()}/orders`;
  try {
    const response = await axios.post<ICashfreeOrderResponse>(url, payload, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Cashfree order creation failed";
    console.error("Cashfree API Error - Create Order:", error.response?.data || error.message);
    const err: any = new Error(`Cashfree Payment Gateway error: ${message}`);
    err.statusCode = error.response?.status || 500;
    throw err;
  }
};

/**
 * Fetches order status from Cashfree Payment Gateway.
 */
export const getCashfreeOrder = async (
  orderId: string
): Promise<ICashfreeOrderResponse> => {
  const url = `${getBaseUrl()}/orders/${encodeURIComponent(orderId)}`;
  try {
    const response = await axios.get<ICashfreeOrderResponse>(url, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to fetch Cashfree order status";
    console.error("Cashfree API Error - Get Order:", error.response?.data || error.message);
    const err: any = new Error(`Cashfree Payment Gateway error: ${message}`);
    err.statusCode = error.response?.status || 500;
    throw err;
  }
};

/**
 * Verifies Cashfree Webhook signature using HMAC-SHA256.
 * Signature formula: base64(hmac_sha256(timestamp + rawBody, secretKey))
 */
export const verifyWebhookSignature = (
  rawBody: string,
  timestamp: string,
  signature: string
): boolean => {
  if (!rawBody || !timestamp || !signature) {
    return false;
  }

  try {
    const secretKey = env.CASHFREE_SECRET_KEY;
    const signatureData = timestamp + rawBody;
    const computedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(signatureData)
      .digest("base64");

    const bufA = Buffer.from(computedSignature);
    const bufB = Buffer.from(signature);

    if (bufA.length !== bufB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  } catch (error) {
    console.error("Webhook Signature Verification Error:", error);
    return false;
  }
};
