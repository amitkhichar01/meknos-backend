import User from "./user.model.ts";
import type { Request, Response } from "express";
import sendResponse from "#src/utils/sendResponse.ts";

export const getMe = async (req: Request, res: Response) => {
  return sendResponse(res, 200, req.user, "User fetched successfully");
};
