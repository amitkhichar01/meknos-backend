import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),

  PORT: z.coerce.number().int().positive(),

  FRONTEND_URL: z.string().min(1),

  MONGODB_URL: z.string().min(1),

  CASHFREE_APP_ID: z.string().min(1),
  CASHFREE_SECRET_KEY: z.string().min(1),
  CASHFREE_ENVIRONMENT: z.enum(["SANDBOX", "PRODUCTION"]),
  CASHFREE_API_VERSION: z.string().min(1),

  JWT_SECRET_KEY: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  GEMINI_API_KEY: z.string().min(1),
});
