import { NextRequest, NextResponse } from 'next/server';
import { WritingContent, WritingFeedback } from '@unity-voice/types';
import { generateWritingPrompt, generateWritingFeedback } from '../../../../services/openai';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// GET /api/tasks/writing - Get writing task
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's current vocabulary words
    const vocabularyResponse = await fetch(`${API_URL}/api/users/current-words`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!vocabularyResponse.ok) {
      throw new Error('Failed to fetch current vocabulary');
    }

    const currentWords = await vocabularyResponse.json();

    // Generate writing prompt using OpenAI
    const writingContent = await generateWritingPrompt(currentWords);

    return NextResponse.json(writingContent);
  } catch (error) {
    console.error('Error fetching writing task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch writing task' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/writing - Submit writing task
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
    const { taskId, response } = body;

    if (!taskId || !response) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate feedback using OpenAI
    const feedback = await generateWritingFeedback(response);

    // Submit writing response
    const submitResponse = await fetch(`${API_URL}/api/writing/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        taskId,
        response,
        feedback
      })
    });

    if (!submitResponse.ok) {
      throw new Error('Failed to submit writing task');
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error submitting writing task:', error);
    return NextResponse.json(
      { error: 'Failed to submit writing task' },
      { status: 500 }
    );
  }
} 