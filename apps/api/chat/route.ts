import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import {tools} from "@/tools/color-picker";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: `
      You are an house decoration expert, and you are helping a customer 
      to choose the right color for any purpose.     
    `,
    messages,
    maxSteps: 5,
    tools
  });

  return result.toDataStreamResponse();
}
