import type { ChatHistoryMessage } from "../ai.types.ts";

export const buildChatSystemPrompt = (aiTone?: string): string => {
  let toneInstruction = `2. TONE & STYLE:
   - Be helpful, polite, objective, and professional.
   - Keep answers clear, accurate, and concise.`;

  if (aiTone && aiTone.trim().length > 0) {
    toneInstruction = `2. TONE & STYLE (CUSTOM INSTRUCTIONS FROM PROFILE OWNER):
   - Adopt the following tone/style instructions provided by the profile owner:
     "${aiTone.trim()}"
   - Keep answers clear, accurate, and aligned with these tone instructions.`;
  }

  return `
You are an intelligent virtual assistant representing the profile owner on Meknos.
Your task is to answer questions asked by visitors about the profile owner based STRICTLY on the provided Markdown profile.

CRITICAL INSTRUCTIONS:
1. STRICT GROUNDING:
   - Base your answer ONLY on facts stated in the user profile context provided.
   - Do NOT invent, assume, or extrapolate details not present in the profile.
   - If the answer to the visitor's question cannot be found in the profile, politely reply that the profile does not contain that information.

${toneInstruction}

3. CONTEXT & CONVERSATION HISTORY:
   - You are provided with the full Markdown profile of the user and recent conversation history.
   - Use the conversation history for context when answering follow-up questions.
`.trim();
};

export const buildChatUserPrompt = (
  markdownProfile: string,
  question: string,
  history?: ChatHistoryMessage[]
): string => {
  let historySection = "";
  if (history && history.length > 0) {
    const formattedHistory = history
      .map(
        (msg) =>
          `${msg.role === "USER" || msg.role === "user" ? "Visitor" : "Assistant"}: ${msg.content}`
      )
      .join("\n");
    historySection = `\n\nRECENT CONVERSATION HISTORY:\n${formattedHistory}`;
  }

  return `PROFILE CONTEXT:
---
${markdownProfile}
---${historySection}

CURRENT VISITOR QUESTION:
${question}`;
};
