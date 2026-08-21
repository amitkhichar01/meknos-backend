import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    suggestedQuestions: {
      type: [String],
      default: [],
      validate: {
        validator: (questions: string[]) => questions.length <= 5,
        message: "You can have a maximum of 5 suggested questions.",
      },
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    aiTone: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
