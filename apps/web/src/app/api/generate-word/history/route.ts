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
          content: "You are a language assistant specializing in Israeli history and heritage terminology."
        },
        {
          role: "user", 
          content: `Generate 5-7 unique words related to Israeli history and heritage, focusing on:
          - Historical milestones
          - Cultural heritage
          - Zionist movement
          - Jewish diaspora experiences
          - Historical resilience

          For each word, provide:
          1. An innovative historical term
          2. Hebrew translation
          3. Detailed historical context
          4. An example sentence showing its significance

          Respond as a JSON array with these fields:
          [{
            "word": "Historical term",
            "translation": "Hebrew translation",
            "definition": "Historical context and meaning",
            "example": "Contextual usage sentence highlighting historical significance"
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
        topic: 'history'
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