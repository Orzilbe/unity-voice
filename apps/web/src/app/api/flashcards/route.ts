// apps/web/src/app/api/flashcards/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    const level = searchParams.get('level') || '1';
    
    // Use 127.0.0.1 instead of localhost
    const response = await fetch(`http://127.0.0.1:5000/api/flashcards/${encodeURIComponent(topic || '')}/${level}`, {
      headers: {
        'Content-Type': 'application/json',
        // Forward any authorization headers
        ...request.headers.get('authorization') 
          ? { 'Authorization': request.headers.get('authorization')! } 
          : {}
      }
    });
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error forwarding to backend:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch flashcards from backend' 
    }, { status: 500 });
  }
}