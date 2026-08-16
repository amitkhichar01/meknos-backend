import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "#src/modules/users/user.model.ts";
import sendResponse from "#src/utils/sendResponse.ts";
import type { JwtPayload } from "#src/modules/auth/auth.types.ts";
import { env } from "#src/config/env.config.ts";


const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) {
      return sendResponse(res, 401, {}, "Unauthorized");
    }
    // Decode token
    const decoded = jwt.verify(token, env.JWT_SECRET_KEY) as JwtPayload;

    if (!decoded || !decoded.id) {
      return sendResponse(res, 401, {}, "Unauthorized - Invalid Token");
    }

    // Find user
    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return sendResponse(res, 401, {}, "Unauthorized - User Not Found");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return sendResponse(res, 401, {}, "Token expired");
    }

    if (error.name === "JsonWebTokenError") {
      return sendResponse(res, 401, {}, "Invalid token");
    }

    return sendResponse(res, 500, {}, "Unauthorized");
  }
};
export default authenticate;
