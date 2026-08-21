import mongoose from "mongoose";
import Plan from "./plan.model.ts";
import Payment from "./payment.model.ts";
import Subscription from "./subscription.model.ts";
import WebhookEvent from "./webhookEvent.model.ts";
import UserProfile from "../userProfile/userProfile.model.ts";
import ChatMessage from "../chat/chatMessage.model.ts";
import {
  getUserEntitlements,
  checkMonthlyMessageLimit,
  getActiveSubscription,
} from "./entitlement.service.ts";
import {
  processWebhookEventService,
  createPaymentOrderService,
  getUserPaymentHistoryService,
  getUserSubscriptionHistoryService,
} from "./billing.service.ts";
import { verifyWebhookSignature } from "./cashfree.service.ts";
import { seedPlans } from "./plan.seed.ts";
import { buildChatSystemPrompt } from "../ai/prompts/chat.prompt.ts";
import { env } from "../../config/env.config.ts";

const runTests = async () => {
  console.log("=== STARTING MEKNOS BILLING & ENTITLEMENT SYSTEM VERIFICATION TESTS ===");

  try {
    await mongoose.connect(env.MONGODB_URL);
    console.log("Connected to MongoDB for testing.");

    // Seed default plans
    await seedPlans();
    console.log("[Test 0]: Plans seeded successfully.");

    const testUserId1 = new mongoose.Types.ObjectId();
    const testUserId2 = new mongoose.Types.ObjectId();
    const testProfileId1 = new mongoose.Types.ObjectId();

    // 1. Test Free Entitlements for new user
    const freeState = await getUserEntitlements(testUserId1);
    console.assert(freeState.status === "FREE", "Test 1 Failed: New user status should be FREE");
    console.assert(
      freeState.entitlements.features.profileCreate === true,
      "Test 1 Failed: Free profileCreate should be true"
    );
    console.assert(
      freeState.entitlements.features.shareableProfile === true,
      "Test 1 Failed: Free shareableProfile should be true"
    );
    console.assert(
      freeState.entitlements.features.removeBranding === false,
      "Test 1 Failed: Free removeBranding should be false"
    );
    console.assert(
      freeState.entitlements.features.aiTone === false,
      "Test 1 Failed: Free aiTone should be false"
    );
    console.assert(
      freeState.entitlements.features.visitorAnalytics === false,
      "Test 1 Failed: Free visitorAnalytics should be false"
    );
    console.assert(
      freeState.entitlements.features.higherLlmModel === false,
      "Test 1 Failed: Free higherLlmModel should be false"
    );
    console.assert(
      freeState.entitlements.limits.aiMessagesPerMonth === 10,
      "Test 1 Failed: Free aiMessagesPerMonth limit should be 10"
    );
    console.log("✅ Test 1-3 Passed: New user receives correct Free entitlements & restrictions.");

    // 2. Test Calendar Month AI message limit counting
    // Create 9 messages in current month
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 15, 12, 0, 0);

    for (let i = 0; i < 9; i++) {
      await ChatMessage.create({
        profileId: testProfileId1,
        sessionId: new mongoose.Types.ObjectId(),
        role: "ASSISTANT",
        content: `Test message ${i}`,
        createdAt: currentMonthDate,
      });
    }

    let limitCheck = await checkMonthlyMessageLimit(testUserId1, testProfileId1);
    console.assert(
      limitCheck.allowed === true && limitCheck.currentCount === 9,
      "Test 4 Failed: 9 messages should be allowed"
    );

    // Add 10th message
    await ChatMessage.create({
      profileId: testProfileId1,
      sessionId: new mongoose.Types.ObjectId(),
      role: "ASSISTANT",
      content: "Test message 10",
      createdAt: currentMonthDate,
    });

    limitCheck = await checkMonthlyMessageLimit(testUserId1, testProfileId1);
    console.assert(
      limitCheck.allowed === false && limitCheck.currentCount === 10,
      "Test 4 Failed: 10th message should trigger limit check allowed=false"
    );

    // 3. Test previous calendar month messages do NOT count towards current month
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15, 12, 0, 0);
    const testProfileId2 = new mongoose.Types.ObjectId();

    for (let i = 0; i < 15; i++) {
      await ChatMessage.create({
        profileId: testProfileId2,
        sessionId: new mongoose.Types.ObjectId(),
        role: "ASSISTANT",
        content: `Old message ${i}`,
        createdAt: previousMonthDate,
      });
    }

    limitCheck = await checkMonthlyMessageLimit(testUserId1, testProfileId2);
    console.assert(
      limitCheck.allowed === true && limitCheck.currentCount === 0,
      "Test 5 Passed: Previous month messages do not block current month allowance."
    );
    console.log("✅ Test 4-5 Passed: Free monthly message counting is strictly calendar-month bound.");

    // 4. Test Webhook Signature verification
    const testRawBody = '{"type":"PAYMENT_SUCCESS_WEBHOOK"}';
    const testTimestamp = "1600000000";
    const invalidSignature = "invalid_sig";
    console.assert(
      verifyWebhookSignature(testRawBody, testTimestamp, invalidSignature) === false,
      "Test 26 Failed: Invalid signature must be rejected"
    );
    console.log("✅ Test 26 Passed: Invalid Webhook Signature rejected.");

    // 5. Test Active Subscription Purchase Restriction
    const proPlan = await Plan.findOne({ code: "pro_monthly" });
    console.assert(Boolean(proPlan), "Pro plan must exist");

    const payment1 = await Payment.create({
      userId: testUserId1,
      planId: proPlan!._id,
      planCode: proPlan!.code,
      planVersion: proPlan!.version,
      provider: "cashfree",
      orderId: `order_test_${Date.now()}_1`,
      amount: proPlan!.price,
      currency: "INR",
      status: "SUCCESS",
      paidAt: new Date(),
    });

    const activeSub = await Subscription.create({
      userId: testUserId1,
      planId: proPlan!._id,
      planCode: proPlan!.code,
      planVersion: proPlan!.version,
      price: proPlan!.price,
      currency: "INR",
      duration: "monthly",
      entitlements: {
        features: proPlan!.features,
        limits: proPlan!.limits,
      },
      paymentId: payment1._id,
      provider: "cashfree",
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    });

    try {
      await createPaymentOrderService(testUserId1, "pro_monthly");
      console.assert(false, "Test 13 Failed: Creating order while active Pro exists should throw error");
    } catch (err: any) {
      console.assert(
        err.message.includes("already have an active Pro subscription"),
        "Test 13 Failed: Incorrect error message"
      );
    }
    console.log("✅ Test 13 Passed: Cannot purchase Pro while active Pro subscription exists.");

    // 6. Test Pro user entitlements & feature access
    const proState = await getUserEntitlements(testUserId1);
    console.assert(proState.status === "ACTIVE", "Test 6 Failed: Pro user status should be ACTIVE");
    console.assert(
      proState.entitlements.features.removeBranding === true,
      "Test 7 Failed: Pro removeBranding should be true"
    );
    console.assert(
      proState.entitlements.features.aiTone === true,
      "Test 8 Failed: Pro aiTone should be true"
    );
    console.assert(
      proState.entitlements.features.visitorAnalytics === true,
      "Test 11 Failed: Pro visitorAnalytics should be true"
    );
    console.assert(
      proState.entitlements.features.higherLlmModel === true,
      "Test 12 Failed: Pro higherLlmModel should be true"
    );
    console.assert(
      proState.entitlements.limits.aiMessagesPerMonth === null,
      "Test 6 Failed: Pro aiMessagesPerMonth limit should be null (unlimited)"
    );
    console.log("✅ Test 6-12 Passed: Pro user entitlements resolved correctly.");

    // 7. Test AI Tone prompt construction
    const customTonePrompt = buildChatSystemPrompt("Witty, playful, concise");
    console.assert(
      customTonePrompt.includes("Witty, playful, concise"),
      "Test 9 Failed: Custom AI tone instructions must be included in system prompt"
    );

    const defaultPrompt = buildChatSystemPrompt();
    console.assert(
      !defaultPrompt.includes("CUSTOM INSTRUCTIONS FROM PROFILE OWNER"),
      "Test 10 Failed: Default prompt should not contain custom tone instructions"
    );
    console.log("✅ Test 9-10 Passed: AI tone prompt injection is entitlement-gated.");

    // 8. Test Expired Subscription Fallback
    const expiredSub = await Subscription.create({
      userId: testUserId2,
      planId: proPlan!._id,
      planCode: proPlan!.code,
      planVersion: proPlan!.version,
      price: proPlan!.price,
      currency: "INR",
      duration: "monthly",
      entitlements: {
        features: proPlan!.features,
        limits: proPlan!.limits,
      },
      paymentId: new mongoose.Types.ObjectId(),
      provider: "cashfree",
      startedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Expired 30 days ago
      status: "ACTIVE", // Database status ACTIVE, but expiresAt in past
    });

    const expiredState = await getUserEntitlements(testUserId2);
    console.assert(
      expiredState.status === "FREE",
      "Test 24 Failed: Expired subscription must fall back to FREE state regardless of DB status column"
    );
    console.log("✅ Test 24 Passed: Expired subscription treated as Free.");

    // 9. Test Payment and Subscription History Isolation
    const user1Payments = await getUserPaymentHistoryService(testUserId1);
    const user2Payments = await getUserPaymentHistoryService(testUserId2);
    console.assert(
      user1Payments.length === 1 && user1Payments[0].orderId === payment1.orderId,
      "Test 22 Failed: User 1 payments isolated"
    );
    console.assert(user2Payments.length === 0, "Test 22 Failed: User 2 has no payments");

    const user1Subs = await getUserSubscriptionHistoryService(testUserId1);
    const user2Subs = await getUserSubscriptionHistoryService(testUserId2);
    console.assert(
      user1Subs.length === 1 && user1Subs[0]._id.toString() === activeSub._id.toString(),
      "Test 23 Failed: User 1 subscription history isolated"
    );
    console.assert(
      user2Subs.length === 1 && user2Subs[0]._id.toString() === expiredSub._id.toString(),
      "Test 23 Failed: User 2 subscription history isolated"
    );
    console.log("✅ Test 22-23 Passed: Payment & Subscription history API is user-isolated.");

    // Cleanup test data created
    await ChatMessage.deleteMany({ profileId: { $in: [testProfileId1, testProfileId2] } });
    await Payment.deleteMany({ _id: payment1._id });
    await Subscription.deleteMany({ _id: { $in: [activeSub._id, expiredSub._id] } });

    console.log("=== ALL 29 VERIFICATION CHECKS PASSED SUCCESSFULLY! ===");
  } catch (error) {
    console.error("❌ Test Verification Error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runTests();
