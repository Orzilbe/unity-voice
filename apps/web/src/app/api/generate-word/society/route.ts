import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import parseJson from 'parse-json';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a language assistant specializing in Israeli society and multiculturalism terminology."
        },
        {
          role: "user",
          content: `Generate 5-7 unique Hebrew words related to Israeli society and multiculturalism, focusing on:
          - Social diversity
          - Cultural integration
          - Interpersonal relationships
          - Societal challenges
          - Multicultural harmony

          For each word, provide:
          1. The Hebrew word
          2. English translation
          3. Detailed definition explaining its social context and multicultural significance
          4. An example sentence in Hebrew showing the word's usage in a social context
          5. English translation of the example sentence

          Respond as a JSON array with these fields:
          [{
            "word": "Hebrew social term",
            "translation": "English translation",
            "definition": "Detailed definition with social context and multicultural significance",
            "example": "Hebrew example sentence showing contextual usage",
            "example_translation": "English translation of the example sentence"
          }, ...]`
        }
      ],
      temperature: 0.6,
      max_tokens: 1000
    });

    const responseText = completion.choices[0].message.content?.trim() || '';
    console.log('Raw response:', responseText); // Log the raw response

    try {
      const wordData = parseJson(responseText) as unknown as Array<any>; // Use parse-json library with safe type casting
      
      const wordsWithIds = wordData.map((word, index) => ({
        ...word,
        id: index + 1,
        topic: 'society'
      }));

      return NextResponse.json(wordsWithIds);
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
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