import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
      index: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["USER", "ASSISTANT"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    generation: {
      provider: {
        type: String,
        default: null,
      },

      model: {
        type: String,
        default: null,
      },

      inputTokens: {
        type: Number,
        default: null,
        min: 0,
      },

      outputTokens: {
        type: Number,
        default: null,
        min: 0,
      },

      totalTokens: {
        type: Number,
        default: null,
        min: 0,
      },

      responseTimeMs: {
        type: Number,
        default: null,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Main query:
 * Get messages of a session in chronological order.
 */
chatMessageSchema.index({
  sessionId: 1,
  createdAt: 1,
});

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;
