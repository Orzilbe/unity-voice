// apps/web/src/app/api/topic/[topicId]/words/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '../../../../../utils/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level') || '1';
    const difficulty = searchParams.get('difficulty') || 'intermediate';
    
    const token = getToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call the backend API to get flashcards for this topic
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/generate-words`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: params.topicId,
          level: parseInt(level),
          difficulty
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          error: data.error || 'Failed to fetch words for this topic' 
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data
    });
  } catch (error) {
    console.error('Error in topic words API route:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}