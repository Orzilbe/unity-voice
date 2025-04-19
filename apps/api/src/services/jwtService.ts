// apps/api/src/services/jwtService.ts
import jwt from 'jsonwebtoken';
import { TokenPayload, AuthUser, AuthResponse, TokenValidationError } from '../types/auth';

/**
 * JWT Service - מחלקת שירות מאוחדת לניהול טוקנים JWT
 */
class JwtService {
  private jwtSecret: string | null = null;

  /**
   * מקבל את סוד ה-JWT מהסביבה או מהמטמון
   */
  private getJwtSecret(): string {
    if (this.jwtSecret) {
      return this.jwtSecret;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set in environment variables');
    }

    this.jwtSecret = secret;
    return secret;
  }

  /**
   * מוודא שמבנה ה-payload של הטוקן תקין
   * @param payload התוכן המפוענח של טוקן
   * @returns מבנה מאומת של TokenPayload
   */
  private validateTokenPayload(payload: any): TokenPayload {
    // בדוק אם זה מבנה טוקן מסוג ישן
    if (payload.userId) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Token payload structure:', payload);
      }
      
      return {
        userId: payload.userId,
        email: payload.email,
        roles: payload.roles || [],
        iat: payload.iat,
        exp: payload.exp
      };
    }

    // אם אין userId, בדוק אם יש id ולהשתמש בו כ-userId
    if (payload.id && !payload.userId) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Legacy token with id detected, adapting payload structure');
      }
      
      return {
        userId: payload.id,
        email: payload.email,
        roles: payload.roles || [],
        iat: payload.iat,
        exp: payload.exp
      };
    }

    // בדוק מבנה טוקן תקין
    if (!payload.email) {
      throw new TokenValidationError('Invalid token payload structure');
    }

    return payload as TokenPayload;
  }

  /**
   * יוצר טוקן JWT חדש
   * @param userId מזהה המשתמש
   * @param email כתובת האימייל של המשתמש
   * @param roles תפקידים אופציונליים של המשתמש
   * @returns טוקן JWT מוצפן
   */
  generateToken(userId: string, email: string, roles: string[] = []): string {
    try {
      const payload: TokenPayload = {
        userId,
        email,
        roles
      };

      const secret = this.getJwtSecret();
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Token Generation:', {
          userId: payload.userId,
          email: payload.email,
          roles: payload.roles,
          hasSecret: !!secret
        });
      }

      const token = jwt.sign(payload, secret, {
        expiresIn: '30d'
      });
      
      return token;
    } catch (error) {
      console.error('Token generation failed:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * מאמת טוקן ומחזיר את תוכנו
   * @param token טוקן JWT לאימות
   * @returns תוכן מפוענח של הטוקן
   */
  verifyToken(token: string): TokenPayload {
    try {
      const secret = this.getJwtSecret();
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Token Verification:', {
          tokenLength: token?.length,
          hasSecret: !!secret
        });
      }

      const decoded = jwt.verify(token, secret) as any;
      return this.validateTokenPayload(decoded);
    } catch (error) {
      console.error('Token verification failed:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        console.error('JWT Error:', {
          name: error.name,
          message: error.message
        });
      }
      throw error;
    }
  }

  /**
   * יוצר מבנה תשובת אימות עם טוקן ומידע על המשתמש
   * @param user אובייקט המשתמש
   * @returns מבנה AuthResponse עם טוקן ונתוני משתמש
   */
  createAuthResponse(user: AuthUser): AuthResponse {
    // בדיקה והתאמה של מזהה המשתמש - נוודא שיש לנו מזהה תקף
    const userId = user.userId || user.id || '';
    if (!userId) {
      throw new Error('User ID is required for token generation');
    }
    
    const token = this.generateToken(
      userId, 
      user.email, 
      user.role ? [user.role] : []
    );
    
    return {
      token,
      user: {
        id: userId,
        userId: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        englishLevel: user.englishLevel,
        score: user.score,
        role: user.role,
        badge: user.badge,
        // אופציונלי - אם הערכים קיימים במשתמש
        ...(user as any).ageRange && { ageRange: (user as any).ageRange },
        ...(user as any).phoneNumber && { phoneNumber: (user as any).phoneNumber },
        ...(user as any).profilePicture && { profilePicture: (user as any).profilePicture }
      }
    };
  }
}

// יצירת אובייקט סינגלטון של השירות
const jwtService = new JwtService();

export default jwtService;