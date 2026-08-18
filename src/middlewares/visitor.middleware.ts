import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { env } from "#src/config/env.config.ts";

export const ensureVisitorId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let visitorId = req.cookies?.visitor_id;

  if (!visitorId) {
    visitorId = crypto.randomUUID();

    res.cookie("visitor_id", visitorId, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    });
  }

  req.visitorId = visitorId;
  next();
};

export default ensureVisitorId;
