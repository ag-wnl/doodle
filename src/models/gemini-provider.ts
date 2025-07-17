import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaseModelProvider, ModelResult } from "./base";

export class GeminiProvider extends BaseModelProvider {
  private model: any;

  constructor(apiKey: string) {
    super();
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateContent(prompt: string): Promise<ModelResult> {
    const result = await this.model.generateContent(prompt);
    return {
      response: {
        text: () => result.response.text(),
      },
    };
  }

  getProviderName(): string {
    return "Gemini";
  }
}
