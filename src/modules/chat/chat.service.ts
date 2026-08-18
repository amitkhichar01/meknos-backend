import UserProfile from "#src/modules/userProfile/userProfile.model.ts";
import ChatSession from "./chatSession.model.ts";
import ChatMessage from "./chatMessage.model.ts";
import { generateChatResponse } from "#src/modules/ai/ai.service.ts";
import type { IChatHistoryResponse, ISendMessageResponseData } from "./chat.types.ts";

const SESSION_INACTIVITY_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Finds or creates an active chat session for a given visitor and profile.
 * Automatically ends sessions inactive for more than 24 hours.
 */
export const getOrCreateActiveSession = async (profileId: any, visitorId: string) => {
  const activeSession = await ChatSession.findOne({
    profileId,
    visitorId,
    status: "ACTIVE",
  }).sort({ lastMessageAt: -1, createdAt: -1 });

  if (activeSession) {
    const lastActivity =
      activeSession.lastMessageAt || activeSession.updatedAt || activeSession.createdAt;
    const isExpired = Date.now() - new Date(lastActivity).getTime() > SESSION_INACTIVITY_LIMIT_MS;

    if (isExpired) {
      activeSession.status = "ENDED";
      await activeSession.save();
    } else {
      return activeSession;
    }
  }

  // Create a new active session
  const newSession = await ChatSession.create({
    profileId,
    visitorId,
    messageCount: 0,
    lastMessageAt: new Date(),
    status: "ACTIVE",
  });

  return newSession;
};

/**
 * Sends a visitor message to a profile, invokes AI generation, and saves conversation.
 */
export const sendMessageToProfileService = async (params: {
  username: string;
  visitorId: string;
  messageText: string;
}): Promise<ISendMessageResponseData> => {
  const { username, visitorId, messageText } = params;

  // 1. Find published profile
  const profile = await UserProfile.findOne({
    username: username.toLowerCase().trim(),
    isPublished: true,
  });

  if (!profile) {
    const error: any = new Error("User profile not found");
    error.statusCode = 404;
    throw error;
  }

  // 2. Resolve active ChatSession
  const session = await getOrCreateActiveSession(profile._id, visitorId);

  // 3. Save visitor user message
  await ChatMessage.create({
    profileId: profile._id,
    sessionId: session._id,
    role: "USER",
    content: messageText,
  });

  // 4. Load recent conversation history (last 10 messages)
  const rawHistory = await ChatMessage.find({ sessionId: session._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Sort chronologically and exclude the current message from history context
  const historyList = rawHistory.reverse();
  const historyForAi = historyList
    .slice(0, -1) // Exclude current message since it's passed separately as question
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

  // 5. Call AI Service for response
  const startTime = Date.now();
  const aiResult = await generateChatResponse({
    markdownProfile: profile.content,
    question: messageText,
    history: historyForAi,
  });
  const responseTimeMs = Date.now() - startTime;

  // 6. Save Assistant response message
  const assistantMessage = await ChatMessage.create({
    profileId: profile._id,
    sessionId: session._id,
    role: "ASSISTANT",
    content: aiResult.text,
    generation: {
      provider: aiResult.provider,
      model: aiResult.model,
      inputTokens: aiResult.usage?.inputTokens ?? 0,
      outputTokens: aiResult.usage?.outputTokens ?? 0,
      totalTokens: aiResult.usage?.totalTokens ?? 0,
      responseTimeMs,
    },
  });

  // 7. Update ChatSession metadata
  session.messageCount += 2;
  session.lastMessageAt = new Date();
  session.status = "ACTIVE";
  await session.save();

  return {
    message: {
      _id: assistantMessage._id,
      role: "ASSISTANT",
      content: assistantMessage.content,
      createdAt: assistantMessage.createdAt,
    },
    session: {
      _id: session._id,
      messageCount: session.messageCount,
      status: session.status,
    },
  };
};

/**
 * Gets active chat history for a visitor and profile.
 */
export const getChatHistoryService = async (params: {
  username: string;
  visitorId: string;
}): Promise<IChatHistoryResponse> => {
  const { username, visitorId } = params;

  // 1. Find published profile
  const profile = await UserProfile.findOne({
    username: username.toLowerCase().trim(),
    isPublished: true,
  });

  if (!profile) {
    const error: any = new Error("User profile not found");
    error.statusCode = 404;
    throw error;
  }

  // 2. Find active ChatSession
  const activeSession = await ChatSession.findOne({
    profileId: profile._id,
    visitorId,
    status: "ACTIVE",
  }).sort({ lastMessageAt: -1, createdAt: -1 });

  if (!activeSession) {
    return {
      session: null,
      messages: [],
    };
  }

  // Check 24-hour expiration
  const lastActivity =
    activeSession.lastMessageAt || activeSession.updatedAt || activeSession.createdAt;
  const isExpired = Date.now() - new Date(lastActivity).getTime() > SESSION_INACTIVITY_LIMIT_MS;

  if (isExpired) {
    activeSession.status = "ENDED";
    await activeSession.save();
    return {
      session: null,
      messages: [],
    };
  }

  // 3. Load active session messages in chronological order
  const messages = await ChatMessage.find({ sessionId: activeSession._id })
    .sort({ createdAt: 1 })
    .select("role content createdAt _id")
    .lean();

  return {
    session: {
      _id: activeSession._id,
      messageCount: activeSession.messageCount,
      status: activeSession.status,
    },
    messages: messages,
  };
};
