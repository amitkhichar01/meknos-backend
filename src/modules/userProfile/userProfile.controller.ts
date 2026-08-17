import type { Request, Response } from "express";
import UserProfile from "./userProfile.model.ts";
import generateUsername from "#src/utils/generateUsername.ts";
import sendResponse from "#src/utils/sendResponse.ts";
import { createUserProfileSchema, updateUserProfileSchema } from "./userProfile.validation.ts";

export const createProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return sendResponse(res, 401, {}, "Unauthorized");
  }

  const validation = createUserProfileSchema.safeParse(req.body);
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || "Invalid input data";
    return sendResponse(res, 400, {}, errorMessage);
  }

  const { content, suggestedQuestions, isPublished } = validation.data;

  // Check if user already has a profile
  const existingProfile = await UserProfile.findOne({ userId: req.user._id });
  if (existingProfile) {
    return sendResponse(res, 409, {}, "User profile already exists");
  }

  // Generate unique username
  const nameToUse = req.user.fullName || "user";

  let username: string | null = null;
  let attempts = 0;

  while (attempts < 5) {
    const candidate = generateUsername(nameToUse);
    if (candidate) {
      const isTaken = await UserProfile.findOne({ username: candidate });
      if (!isTaken) {
        username = candidate;
        break;
      }
    }
    attempts++;
  }

  if (!username) {
    return sendResponse(res, 500, {}, "Failed to generate a unique username");
  }

  const profile = await UserProfile.create({
    userId: req.user._id,
    username,
    content,
    suggestedQuestions,
    isPublished,
  });

  return sendResponse(res, 201, { data: profile }, "User profile created successfully");
};

export const getOwnerProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return sendResponse(res, 401, {}, "Unauthorized");
  }

  const profile = await UserProfile.findOne({ userId: req.user._id });
  if (!profile) {
    return sendResponse(res, 404, {}, "User profile not found");
  }

  return sendResponse(res, 200, { data: profile }, "User profile fetched successfully");
};

export const getPublicProfile = async (req: Request, res: Response) => {
  const { username } = req.params;

  if (!username) {
    return sendResponse(res, 400, {}, "Username parameter is required");
  }

  // Return only isPublished: true data, excluding content and isPublished fields
  const profile = await UserProfile.findOne({
    username: username,
    isPublished: true,
  })
    .select("-content -isPublished")
    .populate("userId", "fullName profileUrl email")
    .lean();

  if (!profile) {
    return sendResponse(res, 404, {}, "User profile not found");
  }

  return sendResponse(res, 200, { data: profile }, "Public profile fetched successfully");
};

export const updateProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return sendResponse(res, 401, {}, "Unauthorized");
  }

  const validation = updateUserProfileSchema.safeParse(req.body);
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || "Invalid input data";
    return sendResponse(res, 400, {}, errorMessage);
  }

  const profile = await UserProfile.findOne({ userId: req.user._id });
  if (!profile) {
    return sendResponse(res, 404, {}, "User profile not found");
  }

  const { content, suggestedQuestions, isPublished } = validation.data;

  if (content !== undefined) {
    profile.content = content;
  }
  if (suggestedQuestions !== undefined) {
    profile.suggestedQuestions = suggestedQuestions;
  }
  if (isPublished !== undefined) {
    profile.isPublished = isPublished;
  }

  await profile.save();

  return sendResponse(res, 200, { data: profile }, "User profile updated successfully");
};
