import mongoose from "mongoose";

const entitlementFeaturesSchema = new mongoose.Schema(
  {
    profileCreate: { type: Boolean, required: true },
    shareableProfile: { type: Boolean, required: true },
    removeBranding: { type: Boolean, required: true },
    aiTone: { type: Boolean, required: true },
    visitorAnalytics: { type: Boolean, required: true },
    higherLlmModel: { type: Boolean, required: true },
  },
  { _id: false }
);

const entitlementLimitsSchema = new mongoose.Schema(
  {
    aiMessagesPerMonth: { type: Number, default: null },
  },
  { _id: false }
);

const entitlementsSchema = new mongoose.Schema(
  {
    features: { type: entitlementFeaturesSchema, required: true },
    limits: { type: entitlementLimitsSchema, required: true },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
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
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
      uppercase: true,
    },
    duration: {
      type: String,
      required: true,
      default: "monthly",
    },
    entitlements: {
      type: entitlementsSchema,
      required: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      default: "cashfree",
    },
    startedAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ userId: 1, createdAt: -1 });
subscriptionSchema.index({ userId: 1, status: 1, expiresAt: 1 });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
