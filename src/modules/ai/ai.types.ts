export interface GenerateTextOptions {
  system?: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface GenerateTextResult {
  text: string;
  provider: string;
  model: string;
  usage: AIUsage;
}
