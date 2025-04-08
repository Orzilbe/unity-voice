//APPS/web/src/app/api/generate-word/security/route.ts
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
          content: "You are a language assistant specializing in military and security terminology related to the Iron Swords War."
        },
        {
          role: "user", 
          content: `Generate 5-7 unique words related to the Iron Swords War, focusing on:
          - Military operations
          - Technological aspects of warfare
          - Strategic challenges
          - Defense and security concepts
          - Resilience and national unity

          For each word, provide:
          1. An innovative military or security term
          2. Hebrew translation
          3. Detailed context of the term
          4. An example sentence showing its significance

          Respond as a JSON array with these fields:
          [{
            "word": "Military/Security term",
            "translation": "Hebrew translation",
            "definition": "Context and meaning in the Iron Swords War",
            "example": "Contextual usage sentence highlighting the term's importance"
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
        topic: 'security'
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