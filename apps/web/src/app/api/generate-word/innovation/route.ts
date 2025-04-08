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
          content: "You are a language assistant specializing in Israeli innovation and technology terminology."
        },
        {
          role: "user", 
          content: `Generate 5-7 unique words related to Israeli innovation and technology, highlighting:
          - Startup ecosystem
          - Technological breakthroughs
          - AI and machine learning
          - Cybersecurity innovations
          - Green tech and sustainability

          For each word, provide:
          1. An innovative technological term
          2. Hebrew translation
          3. Detailed technological context
          4. An example sentence showing its application

          Respond as a JSON array with these fields:
          [{
            "word": "Technological term",
            "translation": "Hebrew translation",
            "definition": "Technological context and innovation",
            "example": "Contextual usage sentence highlighting technological significance"
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
        topic: 'innovation'
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