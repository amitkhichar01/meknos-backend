import { GoogleGenAI } from "@google/genai";
import { env } from "../../../config/env.config.ts";
import type { AIProvider } from "./ai-provider.interface.ts";
import type { GenerateTextOptions, GenerateTextResult, AIUsage } from "../ai.types.ts";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(model: string = "gemini-3.5-flash-lite") {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    this.model = model;
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    try {
      // First attempt using the Gemini Interactions API
      try {
        const interaction = await this.client.interactions.create({
          model: this.model,
          input: options.prompt,
          ...(options.system ? { system_instruction: options.system } : {}),
        });

        const text = interaction.output_text || "";

        const usage: AIUsage = {
          inputTokens:
            (interaction as any).usage?.input_tokens ??
            (interaction as any).usage?.inputTokens ??
            0,
          outputTokens:
            (interaction as any).usage?.output_tokens ??
            (interaction as any).usage?.outputTokens ??
            0,
          totalTokens:
            (interaction as any).usage?.total_tokens ??
            (interaction as any).usage?.totalTokens ??
            0,
        };

        return {
          text,
          provider: "gemini",
          model: this.model,
          usage,
        };
      } catch (interactionError: any) {
        // Fallback to models.generateContent API if interactions is not supported for specific model or payload
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: options.prompt,
          config: {
            ...(options.system ? { systemInstruction: options.system } : {}),
            ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
            ...(options.maxOutputTokens !== undefined
              ? { maxOutputTokens: options.maxOutputTokens }
              : {}),
          },
        });

        const text = response.text || "";

        const usage: AIUsage = {
          inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
          totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
        };

        return {
          text,
          provider: "gemini",
          model: this.model,
          usage,
        };
      }
    } catch (error: any) {
      console.error("[GeminiProvider Error]:", error);
      throw new Error(`Gemini AI generation failed: ${error.message || error}`);
    }
  }
}

export default GeminiProvider;
