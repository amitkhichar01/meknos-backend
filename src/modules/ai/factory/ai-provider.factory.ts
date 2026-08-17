import { aiConfig } from "#src/config/ai.config.ts";
import type { AIProvider } from "../providers/ai-provider.interface.ts";
import { GeminiProvider } from "../providers/gemini.provider.ts";

export const getAIProvider = (): AIProvider => {
  const provider = aiConfig.provider?.toLowerCase();

  switch (provider) {
    case "gemini": {
      const model = aiConfig.model || aiConfig.nanoModel;
      return new GeminiProvider(model);
    }

    case "claude":
    case "anthropic": {
      throw new Error("Claude AI provider is not implemented yet.");
    }

    case "openai": {
      throw new Error("OpenAI provider is not implemented yet.");
    }

    default: {
      throw new Error(`Unsupported AI provider configuration: "${aiConfig.provider}"`);
    }
  }
};
