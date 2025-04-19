// apps/web/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from 'jwt-decode';

export const config = {
  matcher: [
    '/topic/:path*',  // Protect all routes under /topic
    '/api/user-data',  // Protect API routes that require authentication
    '/api/topic',
    '/api/user-topic-progress'
  ]
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Get the token from cookies
  const token = request.cookies.get('token')?.value;
  
  // If no token is found, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Validate the token
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    
    // Add a small buffer (5 minutes) to prevent edge cases
    const bufferTime = 5 * 60;
    if (decoded.exp && (decoded.exp - bufferTime) < currentTime) {
      // Token is expired or about to expire
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('expired', '1');
      return NextResponse.redirect(loginUrl);
    }
    
    // Token is valid, continue to the protected route
    return NextResponse.next();
  } catch (error) {
    // Token is invalid
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}