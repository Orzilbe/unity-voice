// apps/web/src/app/api/create-post/[topicName]/route.ts
// apps/web/src/app/api/create-post/[topicName]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(
  request: NextRequest,
  { params }: { params: { topicName: string } }
) {
  try {
    // Get the topic name from the URL parameters
    const topicName = decodeURIComponent(params.topicName);
    
    // Get authentication token
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Forward the request to the backend API
    const response = await fetch(`${API_URL}/api/post/create/${encodeURIComponent(topicName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.sub}` // or however you structure your token
      },
      body: JSON.stringify(await request.json())
    });
    
    // If the API response wasn't successful, throw an error
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API responded with status ${response.status}`);
    }
    
    // Return the API response
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("Error in create-post API route:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate post", 
        details: error.message || "Unknown error" 
      }, 
      { status: 500 }
    );
  }
}