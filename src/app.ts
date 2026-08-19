import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression";

import sendResponse from "#src/utils/sendResponse.ts";
import authRoutes from "#src/modules/auth/auth.routes.ts";
import userRoutes from "./modules/users/user.routes.ts";
import userProfileRoutes from "./modules/userProfile/userProfile.routes.ts";
import chatRoutes from "./modules/chat/chat.routes.ts";

const app = express();

app.set("trust proxy", 1);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(compression());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// health check route
app.use("/health", (_req: Request, res: Response) => {
  sendResponse(res, 200, { message: "Server is running" });
});

// auth routes
app.use("/auth", authRoutes);
// app.use("/users", userRoutes);
app.use("/user-profiles", userProfileRoutes);
app.use("/public/profiles", chatRoutes);





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
