// apps/api/src/utils/auth.ts
import jwt from 'jsonwebtoken';
import { TokenPayload, TokenValidationError } from '../middlewares/auth';

export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as TokenPayload;

    // Validate payload structure
    if (!decoded.email || !decoded.userId) {
      throw new TokenValidationError('Invalid token payload structure');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenValidationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new TokenValidationError('Invalid token');
    }
    throw error;
  }
};