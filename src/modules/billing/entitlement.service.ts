import type { Types } from "mongoose";
import Subscription from "./subscription.model.ts";
import Plan from "./plan.model.ts";
import ChatMessage from "../chat/chatMessage.model.ts";
import type { IEntitlements, IBillingStateResponse } from "./billing.types.ts";

export const DEFAULT_FREE_ENTITLEMENTS: IEntitlements = {
  features: {
    profileCreate: true,
    shareableProfile: true,
    removeBranding: false,
    aiTone: false,
    visitorAnalytics: false,
    higherLlmModel: false,
  },
  limits: {
    aiMessagesPerMonth: 10,
  },
};

/**
 * Resolves active subscription entitlement snapshot or falls back to current Free Plan entitlements.
 */
export const getUserEntitlements = async (
  userId: string | Types.ObjectId
): Promise<IBillingStateResponse> => {
  const now = new Date();

  // 1. Look for an active paid subscription
  const activeSubscription = await Subscription.findOne({
    userId,
    status: "ACTIVE",
    expiresAt: { $gt: now },
  }).sort({ expiresAt: -1 });

  if (activeSubscription) {
    return {
      plan: {
        code: activeSubscription.planCode,
        name: activeSubscription.planCode === "pro_monthly" ? "Pro" : activeSubscription.planCode,
        version: activeSubscription.planVersion,
      },
      status: "ACTIVE",
      price: activeSubscription.price,
      currency: activeSubscription.currency,
      startedAt: activeSubscription.startedAt,
      expiresAt: activeSubscription.expiresAt,
      entitlements: {
        features: {
          profileCreate: activeSubscription.entitlements.features.profileCreate,
          shareableProfile: activeSubscription.entitlements.features.shareableProfile,
          removeBranding: activeSubscription.entitlements.features.removeBranding,
          aiTone: activeSubscription.entitlements.features.aiTone,
          visitorAnalytics: activeSubscription.entitlements.features.visitorAnalytics,
          higherLlmModel: activeSubscription.entitlements.features.higherLlmModel,
        },
        limits: {
          aiMessagesPerMonth: activeSubscription.entitlements.limits.aiMessagesPerMonth ?? null,
        },
      },
    };
  }

  // 2. Fall back to current Free Plan
  const freePlan = await Plan.findOne({ code: "free" }).lean();
  if (freePlan) {
    return {
      plan: {
        code: freePlan.code,
        name: freePlan.name,
        description: freePlan.description,
        version: freePlan.version,
      },
      status: "FREE",
      entitlements: {
        features: {
          profileCreate: freePlan.features.profileCreate,
          shareableProfile: freePlan.features.shareableProfile,
          removeBranding: freePlan.features.removeBranding,
          aiTone: freePlan.features.aiTone,
          visitorAnalytics: freePlan.features.visitorAnalytics,
          higherLlmModel: freePlan.features.higherLlmModel,
        },
        limits: {
          aiMessagesPerMonth: freePlan.limits.aiMessagesPerMonth ?? 10,
        },
      },
    };
  }

  // 3. Fallback default
  return {
    plan: {
      code: "free",
      name: "Free",
      description: "Default Free Plan",
      version: 1,
    },
    status: "FREE",
    entitlements: DEFAULT_FREE_ENTITLEMENTS,
  };
};

/**
 * Checks if user currently holds an unexpired Pro subscription.
 */
export const getActiveSubscription = async (userId: string | Types.ObjectId) => {
  const now = new Date();
  return Subscription.findOne({
    userId,
    status: "ACTIVE",
    expiresAt: { $gt: now },
  });
};

/**
 * Enforces Free calendar month message limits using ChatMessage history.
 */
export const checkMonthlyMessageLimit = async (
  userId: string | Types.ObjectId,
  profileId: string | Types.ObjectId
): Promise<{ allowed: boolean; currentCount: number; limit: number | null }> => {
  const billingState = await getUserEntitlements(userId);
  const limit = billingState.entitlements.limits.aiMessagesPerMonth;

  // Pro / Unlimited plan
  if (limit === null || limit === undefined) {
    return { allowed: true, currentCount: 0, limit: null };
  }

  // Calculate current calendar month boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Count AI assistant messages generated for this profile in the current calendar month
  const currentCount = await ChatMessage.countDocuments({
    profileId,
    role: "ASSISTANT",
    createdAt: {
      $gte: startOfMonth,
      $lte: endOfMonth,
    },
  });

  if (currentCount >= limit) {
    return { allowed: false, currentCount, limit };
  }

  return { allowed: true, currentCount, limit };
};
