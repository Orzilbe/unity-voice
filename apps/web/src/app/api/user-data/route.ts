// apps/web/src/app/api/user-data/route.ts

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    // Safely extract token from header
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return NextResponse.json(
        { error: 'Invalid authorization header format' },
        { status: 401 }
      );
    }

    const token = tokenParts[1];
    console.log('Token:', token ? 'present' : 'missing');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token in authorization header' },
        { status: 401 }
      );
    }

    // Fetch user data from backend
    console.log('Attempting to fetch from backend:', `${API_URL}/api/users/user-data`);
    const response = await fetch(`${API_URL}/api/users/user-data`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Unauthorized - Please login again' },
          { status: 401 }
        );
      }
      
      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'User data not found',
            details: 'The user profile could not be found. Please try logging in again.'
          },
          { status: 404 }
        );
      }
      
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to fetch user data',
          details: errorData.message || `Server returned status ${response.status}`
        },
        { status: response.status }
      );
    }

    const userData = await response.json();
    console.log('Backend user data:', userData);

    // Return the original structure with minimal transformations
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error in user-data route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}