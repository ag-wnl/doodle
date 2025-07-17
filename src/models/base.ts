export interface ModelResponse {
  text(): string;
}

export interface ModelResult {
  response: ModelResponse;
}

export abstract class BaseModelProvider {
  abstract generateContent(prompt: string): Promise<ModelResult>;
  abstract getProviderName(): string;
}

export enum ModelProvider {
  GEMINI = "gemini",
  OPENAI = "openai",
}
