import { z } from "zod";
import type { Types } from "mongoose";

import { userAuthProvider, userRole, userStatus } from "./user.constants.ts";

const userStatusSchema = z.enum(userStatus);

const userAuthProviderSchema = z.enum(userAuthProvider);

const userRoleSchema = z.enum(userRole);

export const createUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),

  profileUrl: z.string().trim().url("Invalid profile URL"),

  email: z.string().trim().toLowerCase().email("Invalid email address"),

  authProvider: userAuthProviderSchema,
});

export const updateUserSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters")
      .optional(),

    profileUrl: z.string().trim().url("Invalid profile URL").optional(),

    email: z.string().trim().toLowerCase().email("Invalid email address").optional(),
  })
  .strict();

export const userSchema = z.object({
  _id: z.custom<Types.ObjectId>(),
  fullName: z.string(),
  profileUrl: z.string().url(),
  email: z.string().email(),
  status: userStatusSchema,
  role: userRoleSchema,
  authProvider: userAuthProviderSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
