import dotenv from "dotenv";
import { BaseModelProvider, ModelProvider } from "./base";
import { GeminiProvider } from "./gemini-provider";
import { OpenAIProvider } from "./openai-provider";

dotenv.config();

export function createModelProvider(): BaseModelProvider {
  // Check which provider to use based on environment variable
  const provider = process.env.MODEL_PROVIDER?.toLowerCase() as ModelProvider;

  switch (provider) {
    case ModelProvider.OPENAI:
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        throw new Error(
          "OPENAI_API_KEY environment variable is required when using OpenAI provider"
        );
      }
      console.log("🤖 Using OpenAI provider");
      return new OpenAIProvider(openaiKey);

    case ModelProvider.GEMINI:
    default:
      // Default to Gemini if no provider specified or if gemini is specified
      const geminiKey = process.env.GOOGLE_API_KEY;
      if (!geminiKey) {
        throw new Error(
          "GOOGLE_API_KEY environment variable is required when using Gemini provider"
        );
      }
      console.log("🤖 Using Gemini provider");
      return new GeminiProvider(geminiKey);
  }
}

export async function getModel(): Promise<BaseModelProvider> {
  return createModelProvider();
}
