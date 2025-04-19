// apps/web/src/app/api/quiz/words/[topicName]/[level]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

export async function GET(
  request: Request,
  { params }: { params: { topicName: string; level: string } }
) {
  try {
    const { topicName, level } = params;
    
    // Make sure to fully decode the topic name to handle double encoding
    const decodedTopic = decodeURIComponent(decodeURIComponent(topicName));
    
    console.log('Fetching quiz words for topic:', decodedTopic, 'level:', level);
    
    const response = await fetch(`${API_URL}/api/quiz/words/${encodeURIComponent(decodedTopic)}/${level}`, {
      headers: {
        'Content-Type': 'application/json',
        ...request.headers.get('authorization') 
          ? { 'Authorization': request.headers.get('authorization')! } 
          : {}
      }
    });
    
    const data = await response.json();
    console.log('Quiz words response:', data);
    
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching quiz words:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch quiz words',
      data: [] 
    }, { status: 500 });
  }
}