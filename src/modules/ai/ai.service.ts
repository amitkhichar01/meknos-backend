import { getAIProvider } from "./factory/ai-provider.factory.ts";
import { MARKDOWN_SYSTEM_PROMPT, buildMarkdownUserPrompt } from "./prompts/markdown.prompt.ts";
import {
  SUGGESTIONS_SYSTEM_PROMPT,
  buildSuggestionsUserPrompt,
} from "./prompts/suggestions.prompt.ts";
import { CHAT_SYSTEM_PROMPT, buildChatUserPrompt } from "./prompts/chat.prompt.ts";
import { DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS } from "./ai.constants.ts";
import type { GenerateTextResult, ChatHistoryMessage, GenerateChatOptions } from "./ai.types.ts";

/**
 * Sanitizes markdown string by stripping code fence blocks if returned by the LLM.
 */
const sanitizeMarkdown = (text: string): string => {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:markdown)?\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?```\s*$/i, "");
  return cleaned.trim();
};

/**
 * Parses suggested questions from raw JSON or line-separated text.
 */
const parseSuggestedQuestions = (rawText: string): string[] => {
  try {
    let cleanText = rawText.trim();
    cleanText = cleanText.replace(/^```(?:json)?\s*\n?/i, "");
    cleanText = cleanText.replace(/\n?```\s*$/i, "");
    const parsed = JSON.parse(cleanText);
    if (Array.isArray(parsed)) {
      return parsed
        .map((q) => String(q).trim())
        .filter((q) => q.length > 0)
        .slice(0, 5);
    }
  } catch {
    // If JSON parsing fails, fall back to line-by-line extraction
  }

  const lines = rawText
    .split("\n")
    .map((line) => line.replace(/^[\d\.\-\*\s]+/, "").trim())
    .filter((line) => line.length > 0);

  return lines.slice(0, 5);
};

/**
 * Converts raw user profile information into clean, structured Markdown.
 */
export const generateProfileMarkdown = async (rawText: string): Promise<string> => {
  if (!rawText || !rawText.trim()) {
    throw new Error("Raw profile text is required for Markdown generation.");
  }

  const provider = getAIProvider();
  const result = await provider.generateText({
    system: MARKDOWN_SYSTEM_PROMPT,
    prompt: buildMarkdownUserPrompt(rawText),
    temperature: DEFAULT_TEMPERATURE.MARKDOWN,
    maxOutputTokens: DEFAULT_MAX_TOKENS.MARKDOWN,
  });

  return sanitizeMarkdown(result.text);
};

/**
 * Generates 5 suggested visitor questions based on a Markdown profile.
 */
export const generateSuggestedQuestions = async (markdownProfile: string): Promise<string[]> => {
  if (!markdownProfile || !markdownProfile.trim()) {
    throw new Error("Markdown profile context is required for suggested questions.");
  }

  const provider = getAIProvider();
  const result = await provider.generateText({
    system: SUGGESTIONS_SYSTEM_PROMPT,
    prompt: buildSuggestionsUserPrompt(markdownProfile),
    temperature: DEFAULT_TEMPERATURE.SUGGESTIONS,
    maxOutputTokens: DEFAULT_MAX_TOKENS.SUGGESTIONS,
  });

  return parseSuggestedQuestions(result.text);
};

/**
 * Answers a visitor's question using the complete Markdown profile as context and recent history.
 */
export const generateChatResponse = async ({
  markdownProfile,
  question,
  history,
}: GenerateChatOptions): Promise<GenerateTextResult> => {
  if (!markdownProfile || !markdownProfile.trim()) {
    throw new Error("Markdown profile context is required for chat responses.");
  }
  if (!question || !question.trim()) {
    throw new Error("Visitor question is required.");
  }

  const provider = getAIProvider();
  const result = await provider.generateText({
    system: CHAT_SYSTEM_PROMPT,
    prompt: buildChatUserPrompt(markdownProfile, question, history),
    temperature: DEFAULT_TEMPERATURE.CHAT,
    maxOutputTokens: DEFAULT_MAX_TOKENS.CHAT,
  });

  return result;
};
