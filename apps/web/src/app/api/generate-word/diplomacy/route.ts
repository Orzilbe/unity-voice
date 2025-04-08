//apps/web/src/app/api/generate-word/diplomacy/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: "You are a language assistant specializing in diplomatic and international relations terminology."
        },
        {
          role: "user", 
          content: `Generate 5-7 unique words related to diplomacy and international relations, highlighting:
          - Diplomatic negotiations
          - International conflict resolution
          - Geopolitical strategies
          - Cross-cultural communication
          - Israeli diplomatic challenges

          For each word, provide:
          1. An innovative diplomatic term
          2. Hebrew translation
          3. Detailed diplomatic context
          4. An example sentence showing its application

          Respond as a JSON array with these fields:
          [{
            "word": "Diplomatic term",
            "translation": "Hebrew translation",
            "definition": "Diplomatic context and meaning",
            "example": "Contextual usage sentence highlighting diplomatic nuance"
          }, ...]`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const responseText = completion.choices[0].message.content?.trim() || '';
    
    try {
      const wordData = JSON.parse(responseText);
      
      const wordsWithIds = wordData.map((word, index) => ({
        ...word,
        id: index + 1,
        topic: 'diplomacy'
      }));

      return NextResponse.json(wordsWithIds);
    } catch (parseError) {
      console.error('Failed to parse response:', responseText);
      return NextResponse.json(
        { error: 'Invalid response format', details: responseText },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Full error details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate words', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}