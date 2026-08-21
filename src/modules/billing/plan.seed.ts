import Plan from "./plan.model.ts";

export const seedPlans = async () => {
  try {
    const freePlanExists = await Plan.findOne({ code: "free" });
    if (!freePlanExists) {
      await Plan.create({
        code: "free",
        name: "Free",
        description: "Free plan with profile creation and 10 AI messages per calendar month.",
        price: 0,
        currency: "INR",
        duration: "monthly",
        version: 1,
        isActive: true,
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
      });
      console.log("Seeded default Free Plan.");
    }

    const proPlanExists = await Plan.findOne({ code: "pro_monthly" });
    if (!proPlanExists) {
      await Plan.create({
        code: "pro_monthly",
        name: "Pro",
        description:
          "Pro plan with unlimited AI messages, custom AI tone, higher LLM model, branding removal, and visitor analytics.",
        price: 499,
        currency: "INR",
        duration: "monthly",
        version: 1,
        isActive: true,
        features: {
          profileCreate: true,
          shareableProfile: true,
          removeBranding: true,
          aiTone: true,
          visitorAnalytics: true,
          higherLlmModel: true,
        },
        limits: {
          aiMessagesPerMonth: null,
        },
      });
      console.log("Seeded default Pro Plan.");
    }
  } catch (error) {
    console.error("Error seeding plans:", error);
  }
};
