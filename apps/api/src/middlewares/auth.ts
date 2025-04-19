// apps/api/src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { Types, Document } from 'mongoose';
import { verifyToken } from '../utils/auth'

/**
 * Authentication types and interfaces
 */
export interface TokenPayload {
  userId: string;
  email: string;
  roles?: string[];
  exp?: number;
}

export interface AuthUser {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  englishLevel: string;
  score?: number;
  badge?: {
    type: string;
    name: string;
    icon: string;
  };
  role: string;
  ageRange?: string;
  profilePicture?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export class TokenValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenValidationError';
  }
}

/**
 * Extend Express Request type to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      authUser?: AuthUser; // Full user object with profile details
    }
  }
}

/**
 * Middleware to enforce authentication
 * Returns 401 if no valid token is provided
 */
/**
 * Generate JWT token and auth response for a user
 * @param user User document from database
 * @returns AuthResponse containing token and user data
 */
function generateAuthResponse(user: IUser): { token: string, user: any } {
  // Implementation depends on your JWT signing method
  // This is just a placeholder showing the structure
  const token = jwt.sign(
    { 
      userId: user.userId || user.id, 
      email: user.email,
      roles: user.role ? [user.role] : [] // Use role field from User interface
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      userId: user.userId || user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      englishLevel: user.englishLevel,
      role: user.role,
      ...(user.ageRange && { ageRange: user.ageRange }),
      ...(user.profilePicture && { profilePicture: user.profilePicture }),
      ...(user.score !== undefined && { score: user.score }),
      ...(user.badge && { badge: user.badge })
    }
  };
};

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication token is required'
      });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid authorization header format'
      });
    }

    const token = tokenParts[1];

    try {
      // Verify token using the utility function
      const decoded = verifyToken(token);
      
      // Find user by email (more reliable than ID across systems)
      const user = await User.findOne({ email: decoded.email });
      
      if (!user) {
        return res.status(401).json({
          code: 'INVALID_TOKEN',
          message: 'User not found'
        });
      }

      // Attach token payload to req.user
      req.user = {
        userId: user.userId || (user as Document).id,
        email: user.email,
        roles: user.role ? [user.role] : [],
        ...(decoded.exp && { exp: decoded.exp })
      };
      
      // Also attach the full user object to req.authUser for convenient access to user details
      req.authUser = {
        id: (user as Document).id,
        userId: user.userId || (user as Document).id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        englishLevel: user.englishLevel,
        role: user.role,
        ...(user.ageRange && { ageRange: user.ageRange }),
        ...(user.profilePicture && { profilePicture: user.profilePicture }),
        ...(user.score !== undefined && { score: user.score }),
        ...(user.badge && { badge: user.badge })
      };

      next();
    } catch (error) {
      if (error instanceof TokenValidationError) {
        return res.status(401).json({
          code: 'INVALID_TOKEN',
          message: 'Invalid token payload structure'
        });
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token'
        });
      }
      
      return res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Authentication failed'
      });
    }
  } catch (error) {
    console.error('Unexpected authentication error:', error);
    return res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred during authentication'
    });
  }
};

/**
 * Middleware for optional authentication
 * Continues the request even if no token is provided or token is invalid
 */
export const optional = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  try {
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return next();
    }

    const token = tokenParts[1];
    
    // Use the imported verifyToken function
    const decoded = verifyToken(token);
    
    const user = await User.findOne({ email: decoded.email });
    if (user) {
      req.user = {
        userId: user.userId || (user as Document).id,
        email: user.email,
        roles: user.role ? [user.role] : [],
        ...(decoded.exp && { exp: decoded.exp })
      };
    }
  } catch (error) {
    // Silently handle errors in optional authentication
    if (process.env.NODE_ENV === 'development') {
      console.log('Optional auth error:', error);
    }
  }
  
  next();
};

/**
 * Middleware to check user roles
 * @param allowedRoles Array of role names that are allowed to access the route
 */
export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    // Check if user has any of the required roles
    const userRoles = req.user.roles || [];
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Middleware that requires the authenticated user to match the requested resource
 * Useful for ensuring users can only access their own resources
 * @param paramIdField The URL parameter field that contains the resource owner's ID
 */
export const requireSelf = (paramIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    const resourceOwnerId = req.params[paramIdField];
    
    if (!resourceOwnerId) {
      return res.status(400).json({
        code: 'BAD_REQUEST',
        message: `Resource ID parameter '${paramIdField}' is missing`
      });
    }

    // Check if the authenticated user is the owner of the resource
    if (req.user.userId !== resourceOwnerId) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Factory function to create a middleware that requires either specific roles or self-ownership
 * @param allowedRoles Array of role names that are allowed to access the route
 * @param paramIdField The URL parameter field that contains the resource owner's ID
 */
export const requireRolesOrSelf = (allowedRoles: string[], paramIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    // Check for admin/allowed roles first
    const userRoles = req.user.roles || [];
    const hasRolePermission = allowedRoles.some(role => userRoles.includes(role));
    
    if (hasRolePermission) {
      return next();
    }
    
    // If not an admin, check if user owns the resource
    const resourceOwnerId = req.params[paramIdField];
    
    if (!resourceOwnerId) {
      return res.status(400).json({
        code: 'BAD_REQUEST',
        message: `Resource ID parameter '${paramIdField}' is missing`
      });
    }

    if (req.user.userId !== resourceOwnerId) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};