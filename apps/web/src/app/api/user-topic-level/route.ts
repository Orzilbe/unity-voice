// apps/web/src/app/api/user-topic-level/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicName = searchParams.get('topicName');
    
    if (!topicName) {
      return Response.json({
        success: false,
        error: 'Topic name is required'
      }, { status: 400 });
    }

    const response = await fetch(`http://127.0.0.1:5000/api/user-topic-level?topicName=${encodeURIComponent(topicName)}`, {
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
    console.error('Error forwarding to backend:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch user topic level',
      level: 1 // Default level if error
    }, { status: 500 });
  }
}