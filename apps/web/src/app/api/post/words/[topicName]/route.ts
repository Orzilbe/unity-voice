// apps/web/src/app/api/post/words/[topicName]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

export async function GET(
  request: Request,
  { params }: { params: { topicName: string } }
) {
  try {
    const { topicName } = params;
    
    // Decode the URL parameters
    const decodedTopic = decodeURIComponent(topicName);
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ 
        success: false, 
        error: 'No authorization header provided',
        words: [] 
      }, { status: 401 });
    }
    
    console.log(`Fetching post words for topic: ${decodedTopic}`);
    
    // Forward the request to the backend
    const response = await fetch(`${API_URL}/api/post/words/${encodeURIComponent(decodedTopic)}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });
    
    const data = await response.json();
    console.log('Post words response:', data);
    
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching post words:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch learned words for post',
      words: [] 
    }, { status: 500 });
  }
}