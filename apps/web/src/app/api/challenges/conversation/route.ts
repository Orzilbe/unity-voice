//apps/web/src/app/api/tasks/conversation/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ConversationContent, ConversationFeedback } from '@unity-voice/types';
import { generateConversationScenario, generateConversationFeedback } from '../../../../services/openai';
import { OpenAIError } from '../../../../utils/openai-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// GET /api/tasks/conversation - Get conversation task
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's recent writing response
    const writingResponse = await fetch(`${API_URL}/api/users/recent-writing`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!writingResponse.ok) {
      throw new Error('Failed to fetch recent writing');
    }

    const recentWriting = await writingResponse.json();

    // Generate conversation scenario using OpenAI
    const conversationContent = await generateConversationScenario(recentWriting);

    return NextResponse.json(conversationContent);
  } catch (error) {
    console.error('Error fetching conversation task:', error);
    
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
      { error: 'Failed to fetch conversation task' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/conversation - Submit conversation task
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
    const { taskId, messages } = body;

    if (!taskId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate feedback using OpenAI
    const feedback = await generateConversationFeedback(messages);

    // Submit conversation
    const submitResponse = await fetch(`${API_URL}/api/conversation/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        taskId,
        messages,
        feedback
      })
    });

    if (!submitResponse.ok) {
      throw new Error('Failed to submit conversation task');
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error submitting conversation task:', error);
    
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
      { error: 'Failed to submit conversation task' },
      { status: 500 }
    );
  }
} 