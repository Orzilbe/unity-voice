// apps/web/src/app/api/topics/route.ts
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: 'No token provided' }, 
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/api/topics`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Topics fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching topics' }, 
      { status: 500 }
    );
  }
}