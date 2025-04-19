// apps/web/src/app/api/challenges/vocabulary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Word, Quiz } from '@unity-voice/types';
import { generateVocabularyChallenge } from '../../../../services/openai';
import { OpenAIError } from '../../../../utils/openai-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// GET /api/tasks/vocabulary - Get vocabulary task
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's learned words
    const learnedWordsResponse = await fetch(`${API_URL}/api/users/learned-words`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!learnedWordsResponse.ok) {
      throw new Error('Failed to fetch learned words');
    }

    const learnedWords: string[] = await learnedWordsResponse.json();

    // Get new vocabulary words
    const vocabularyResponse = await fetch(`${API_URL}/api/vocabulary/new`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        excludeWords: learnedWords,
        count: 5 // Get 5 new words
      })
    });

    if (!vocabularyResponse.ok) {
      throw new Error('Failed to fetch vocabulary');
    }

    const words: Word[] = await vocabularyResponse.json();

    // Generate quiz using OpenAI
    const quiz = await generateVocabularyChallenge(words);

    return NextResponse.json({
      words,
      quiz
    });
  } catch (error) {
    console.error('Error fetching vocabulary task:', error);
    
    if (error instanceof OpenAIError) {
      return NextResponse.json(
        { 
          error: error.message,
          retryAfter: error.retryAfter
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch vocabulary task' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/vocabulary - Submit vocabulary task
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { wordIds, quizAnswers } = body;

    if (!wordIds || !quizAnswers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Submit vocabulary task
    const submitResponse = await fetch(`${API_URL}/api/vocabulary/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        wordIds,
        quizAnswers
      })
    });

    if (!submitResponse.ok) {
      throw new Error('Failed to submit vocabulary task');
    }

    const result = await submitResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error submitting vocabulary task:', error);
    return NextResponse.json(
      { error: 'Failed to submit vocabulary task' },
      { status: 500 }
    );
  }
} 