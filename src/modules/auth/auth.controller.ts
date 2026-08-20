import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../../modules/users/user.model.ts";
import sendResponse from "../../utils/sendResponse.ts";
import { verifyGoogleIdToken } from "./auth.service.ts";
import { env } from "../../config/env.config.ts";

const JWT_SECRET_KEY = env.JWT_SECRET_KEY;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN as `${number}${"s" | "m" | "h" | "d" | "w" | "y"}`;
const NODE_ENV = env.NODE_ENV;

export const googleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  const userData = await verifyGoogleIdToken(idToken);

  if (!userData) {
    return sendResponse(res, 400, {}, "Failed to login with google");
  }

  const { email, name, picture } = userData;

  let user = await User.findOne({ email });

  if (user) {
    //if user updated any field from google account, update the user in database
    let isUpdated = false;
    if (user.fullName !== name) {
      user.fullName = name;
      isUpdated = true;
    }
    if (user.profileUrl !== picture) {
      user.profileUrl = picture;
      isUpdated = true;
    }
    if (isUpdated) {
      await user.save();
    }
  } else {
    user = await User.create({
      email,
      fullName: name,
      profileUrl: picture,
      authProvider: "GOOGLE",
      status: "ACTIVE",
      role: "USER",
    });
  }

  // Generate JWT auth token
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET_KEY, {
    expiresIn: JWT_EXPIRES_IN,
  });

  // Set cookie for browser session handling
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return sendResponse(
    res,
    200,
    {
      data: user,
      token,
    },
    "Login successful"
  );
};

// logout function
export const logout = async (req: Request, res: Response) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: NODE_ENV === "production" ? "none" : "lax",
  });
  return sendResponse(res, 200, {}, "Logout successful");
};

export const getMe = async (req: Request, res: Response) => {
  return sendResponse(res, 200, { data: req.user }, "User fetched successfully");
};
