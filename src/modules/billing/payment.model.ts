import mongoose from "mongoose";
import { uppercase } from "zod";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    planCode: {
      type: String,
      required: true,
    },
    planVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    provider: {
      type: String,
      required: true,
      default: "cashfree",
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cfPaymentId: {
      type: String,
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "USER_DROPPED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    paymentGroup: {
      type: String,
      default: null,
    },
    paymentMessage: {
      type: String,
      default: null,
    },
    bankReference: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ userId: 1, status: 1 });

export const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
