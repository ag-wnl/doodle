import OpenAI from "openai";
import { BaseModelProvider, ModelResult } from "./base";

export class OpenAIProvider extends BaseModelProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    super();
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateContent(prompt: string): Promise<ModelResult> {
    const completion = await this.client.chat.completions.create({
      model: "o4-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "";

    return {
      response: {
        text: () => content,
      },
    };
  }

  getProviderName(): string {
    return "OpenAI";
  }
}
