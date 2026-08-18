import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
      index: true,
    },

    visitorId: {
      type: String,
      required: true,
      index: true,
    },

    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "ENDED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * One visitor can have multiple sessions with the same profile,
 * but only one active session should normally be reused.
 */
chatSessionSchema.index({
  profileId: 1,
  visitorId: 1,
  status: 1,
  lastMessageAt: -1,
});

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;
