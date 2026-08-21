import mongoose from "mongoose";

const planFeaturesSchema = new mongoose.Schema(
  {
    profileCreate: { type: Boolean, default: true },
    shareableProfile: { type: Boolean, default: true },
    removeBranding: { type: Boolean, default: false },
    aiTone: { type: Boolean, default: false },
    visitorAnalytics: { type: Boolean, default: false },
    higherLlmModel: { type: Boolean, default: false },
  },
  { _id: false }
);

const planLimitsSchema = new mongoose.Schema(
  {
    aiMessagesPerMonth: { type: Number, default: null }, // null means unlimited
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    duration: {
      type: String,
      default: "monthly",
      trim: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    features: {
      type: planFeaturesSchema,
      required: true,
    },
    limits: {
      type: planLimitsSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Plan = mongoose.model("Plan", planSchema);

export default Plan;
