// apps/api/src/types/auth.ts

/**
 * מבנה תוכן הטוקן JWT
 */
export interface TokenPayload {
  userId: string;
  email: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

/**
 * מבנה מידע על משתמש מאומת
 */
export interface AuthUser {
  id?: string;
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  englishLevel: 'beginner' | 'intermediate' | 'advanced'; // EnglishLevel מפקג' הטיפוסים
  role?: string;
  score?: number;
  badge?: {
    type: string;
    name: string;
    icon: string;
    description?: string;
    pointsRequired?: number;
    id?: number;
    dateEarned?: Date;
  };
}

/**
 * מבנה תשובת אימות
 */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    englishLevel: string;
    role?: string;
    score?: number;
    badge?: {
      type: string;
      name: string;
      icon: string;
      description?: string;
      pointsRequired?: number;
      id?: number;
      dateEarned?: Date;
    };
    ageRange?: string;
    phoneNumber?: string;
    profilePicture?: string;
  };
}

/**
 * שגיאת אימות טוקן
 */
export class TokenValidationError extends Error {
  payload?: any;

  constructor(message: string, payload?: any) {
    super(message);
    this.name = 'TokenValidationError';
    this.payload = payload;
  }
}