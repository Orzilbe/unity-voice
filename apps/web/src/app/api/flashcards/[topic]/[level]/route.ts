// apps/web/src/app/api/flashcards/[topic]/[level]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

export async function GET(
  request: Request,
  { params }: { params: { topic: string; level: string } }
) {
  try {
    const { topic, level } = params;
    
    // Decode the URL parameters to prevent double encoding
    const decodedTopic = decodeURIComponent(topic);
    
    // Now encode properly for the backend call
    const response = await fetch(`${API_URL}/api/flashcards/${encodeURIComponent(decodedTopic)}/${level}`, {
      headers: {
        'Content-Type': 'application/json',
        ...request.headers.get('authorization') 
          ? { 'Authorization': request.headers.get('authorization')! } 
          : {}
      }
    });
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch flashcards',
      data: [] 
    }, { status: 500 });
  }
}