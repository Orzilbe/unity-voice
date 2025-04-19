// apps/web/src/utils/auth.ts
import { jwtDecode } from 'jwt-decode';
import { cookies } from 'next/headers';

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // Try to get token from cookies first
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    
    if (cookieToken) {
      return cookieToken;
    }
    
    // Fallback to localStorage for backward compatibility
    return localStorage.getItem('token');
  }
  return null;
};

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    // Set cookie with proper expiration
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // 7 days
    document.cookie = `token=${token}; path=/; expires=${expirationDate.toUTCString()}; secure; samesite=strict`;
    
    // Also store in localStorage for backward compatibility
    localStorage.setItem('token', token);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    // Remove cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const isTokenValid = (token: string): boolean => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Add a small buffer (5 minutes) to prevent edge cases
    const bufferTime = 5 * 60;
    
    return !!(decoded.exp && (decoded.exp - bufferTime) > currentTime);
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  return isTokenValid(token);
};

export const getDecodedToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Token decoding error:', error);
    return null;
  }
};