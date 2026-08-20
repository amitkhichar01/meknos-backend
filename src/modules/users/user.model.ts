import { userStatus, userAuthProvider, userRole } from "../../modules/users/user.constants.ts";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    profileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: userStatus,
      default: userStatus[0],
      uppercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: userRole,
      default: userRole[1],
      uppercase: true,
      trim: true,
    },
    authProvider: {
      type: String,
      required: true,
      enum: userAuthProvider,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
export default User;
