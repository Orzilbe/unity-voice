// apps/web/src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const backendResponse = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // בדיקה אם התשובה תקינה לפני ניסיון לפרסר כ-JSON
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('API error response:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        body: errorText
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Server error: ${backendResponse.status} ${backendResponse.statusText}` 
        },
        { status: backendResponse.status }
      );
    }
    
    // רק אם התשובה תקינה, ננסה לפרסר אותה כ-JSON
    const data = await backendResponse.json();
    
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error in register API route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}