import mongoose from "mongoose";
import { env } from "./env.config.ts";

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URL);
    console.log("MongoDB connected");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB error";
    console.error("MongoDB connection error:", message);
    process.exit(1);
  }
};

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

export default connectDB;
