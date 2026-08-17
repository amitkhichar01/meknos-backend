import { z } from "zod";
import type { Types } from "mongoose";

export const createUserProfileSchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
  suggestedQuestions: z
    .array(z.string().trim().min(1, "Question cannot be empty"))
    .max(5, "You can have a maximum of 5 suggested questions")
    .optional()
    .default([]),
  isPublished: z.boolean().optional().default(false),
});

export const updateUserProfileSchema = z
  .object({
    content: z.string().trim().min(1, "Content cannot be empty").optional(),
    suggestedQuestions: z
      .array(z.string().trim().min(1, "Question cannot be empty"))
      .max(5, "You can have a maximum of 5 suggested questions")
      .optional(),
    isPublished: z.boolean().optional(),
  })
  .strict();

export const userProfileSchema = z.object({
  _id: z.custom<Types.ObjectId>(),
  userId: z.custom<Types.ObjectId>(),
  username: z.string(),
  content: z.string(),
  suggestedQuestions: z.array(z.string()),
  isPublished: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
