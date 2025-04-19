// apps/web/src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body)
    };

    const apiResponse = await fetch(`${API_URL}/api/auth/login`, fetchOptions);

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Authentication failed' 
        },
        { status: apiResponse.status }
      );
    }

    // Validate response structure
    if (!data.success || !data.data?.token) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid response format'
        },
        { status: 500 }
      );
    }

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    };

    const response = NextResponse.json(
      { 
        success: true, 
        data: {
          user: data.data.user,
          token: data.data.token
        }
      },
      { status: 200 }
    );

    // Set cookies
    response.cookies.set('token', data.data.token, cookieOptions);
    response.cookies.set('user', JSON.stringify(data.data.user), cookieOptions);

    return response;

  } catch (error) {
    console.error('Login request error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process login request'
      }, 
      { status: 500 }
    );
  }
}