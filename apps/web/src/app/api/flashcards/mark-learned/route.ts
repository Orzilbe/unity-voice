// apps/web/src/app/api/flashcards/mark-learned/route.ts
export async function POST(request: Request) {
    try {
      const body = await request.json();
      
      // Use 127.0.0.1 instead of localhost
      const response = await fetch('http://127.0.0.1:5000/api/flashcards/mark-learned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward authorization header if present
          ...request.headers.get('authorization') 
            ? { 'Authorization': request.headers.get('authorization')! } 
            : {}
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      return Response.json(data);
    } catch (error) {
      console.error('Error forwarding to backend:', error);
      return Response.json({ 
        success: false, 
        error: 'Failed to mark word as learned' 
      }, { status: 500 });
    }
  }