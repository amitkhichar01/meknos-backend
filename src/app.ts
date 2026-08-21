import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression";

import sendResponse from "./utils/sendResponse.ts";
import authRoutes from "./modules/auth/auth.routes.ts";
import userRoutes from "./modules/users/user.routes.ts";
import userProfileRoutes from "./modules/userProfile/userProfile.routes.ts";
import chatRoutes from "./modules/chat/chat.routes.ts";
import billingRoutes from "./modules/billing/billing.routes.ts";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://meknos.amitkhichar.in",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(
  express.json({
    limit: "50mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(compression());
app.use(cookieParser());

// health check route
app.use("/health", (_req: Request, res: Response) => {
  sendResponse(res, 200, { message: "Server is running" });
});

// auth routes
app.use("/auth", authRoutes);
// app.use("/users", userRoutes);
app.use("/user-profiles", userProfileRoutes);
app.use("/public/profiles", chatRoutes);
app.use("/billing", billingRoutes);

// not found route
app.use((_req: Request, res: Response) => {
  sendResponse(res, 404, {}, "Route not found");
});

// global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  if (err instanceof Error && "code" in err && err.code === 11000) {
    return sendResponse(res, 409, {}, "Resource already exists");
  }

  const statusCode =
    typeof err === "object" &&
    err !== null &&
    "statusCode" in err &&
    typeof err.statusCode === "number"
      ? err.statusCode
      : 500;

  const message = err instanceof Error ? err.message : "Internal Server Error";

  sendResponse(res, statusCode, {}, message);
});

export default app;
