// apps/api/src/services/openai.ts
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export class OpenAIClient {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateContent(prompt: string): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4", // Or the model you want to use
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant specialized in language learning and vocabulary building. You provide accurate Hebrew translations of English words relevant to specific topic."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      return response;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error(`Failed to generate content: ${error}`);
    }
  }
}

export default OpenAIClient;