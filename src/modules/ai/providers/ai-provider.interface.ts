import type { GenerateTextOptions, GenerateTextResult } from "../ai.types.ts";

export interface AIProvider {
  generateText(options: GenerateTextOptions): Promise<GenerateTextResult>;
}
