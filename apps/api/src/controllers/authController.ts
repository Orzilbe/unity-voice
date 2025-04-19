// apps/api/src/controllers/authController.ts
import { Request, Response } from 'express';
import User from '../models/User';
import jwtService from '../services/jwtService';
import { BadgeType, BADGES } from '@unity-voice/types';
import Topic from '../models/Topic';
import UserInLevel from '../models/UserInLevel';
import { Types } from 'mongoose';

// Define request types
interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
  ageRange: string;
  englishLevel: string;
  profilePicture?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

// Helper function to create initial UserInLevel records
const createInitialUserInLevel = async (userId: string) => {
  try {
    // Get all topic
    const topic = await Topic.find({});
    
    // Create UserInLevel records for each topic
    const userInLevelPromises = topic.map((topic) => 
      UserInLevel.create({
        userId: userId,  // שימוש ב-userId במקום userEmail
        level: 1,
        topic: {  // שים לב שעכשיו זה אובייקט מלא שעונה על הדרישות של המודל
          topicName: topic.topicName,
          topicHe: topic.topicHe || '',  // הוסף ערך ברירת מחדל למקרה שאין ערך
          icon: topic.icon || '📚'       // הוסף ערך ברירת מחדל למקרה שאין ערך
        },
        EarnedScore: 0,
        createdAt: new Date(),
        IsCompleted: false
      })
    );
    
    await Promise.all(userInLevelPromises);
    console.log(`Created ${topic.length} UserInLevel records for user ${userId}`);
  } catch (error) {
    console.warn('Error creating initial UserInLevel records:', error);
    // הוסף פירוט על השגיאה
    if (error instanceof Error) {
      console.warn('Error details:', error.message);
    }
    // לא נזרוק את השגיאה - נרצה להמשיך ביצירת המשתמש גם אם זה נכשל
  }
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, password, phoneNumber, ageRange, englishLevel, profilePicture } = req.body as RegisterRequest;

    console.log('Registration attempt:', { email });

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      console.log('Registration failed: User exists', { email });
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create default badge object
    const defaultBadge = {
      ...BADGES[BadgeType.EXPLAINER_IN_DIAPERS],
      id: 1,
      dateEarned: new Date()
    };

    // Create user with default badge
    const user = await User.create({
      email,
      firstName,
      lastName,
      password,
      phoneNumber,
      ageRange,
      englishLevel,
      profilePicture,
      score: 0,
      badge: defaultBadge,
      role: 'user' // Default role
    });

    if (user) {
      // Create initial UserInLevel records
      await createInitialUserInLevel(user._id instanceof Types.ObjectId ? user._id.toString() : String(user._id));
      
      // Create auth response using JWT service
      const authResponse = jwtService.createAuthResponse({
        userId: (user._id as Types.ObjectId).toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        englishLevel: user.englishLevel,
        role: user.role,
        score: user.score,
        badge: user.badge
      });

      console.log('Registration successful:', {
        userId: authResponse.user.id,
        email: authResponse.user.email
      });

      res.status(201).json({
        success: true,
        data: {
          ...authResponse.user,
          token: authResponse.token,
          phoneNumber: user.phoneNumber,
          ageRange: user.ageRange,
          profilePicture: user.profilePicture
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      user.lastLogin = new Date();
      await user.save();

      // Create auth response using JWT service
      const authResponse = jwtService.createAuthResponse({
        userId: (user._id as Types.ObjectId).toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        englishLevel: user.englishLevel,
        role: user.role,
        score: user.score,
        badge: user.badge
      });

     console.log(`User ${user.email} logged in successfully`);

      // Ensure consistent response format
      return res.status(200).json({
        success: true,
        data: {
          user: {
            ...authResponse.user,
            phoneNumber: user.phoneNumber,
            ageRange: user.ageRange,
            profilePicture: user.profilePicture
          },
          token: authResponse.token
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Detailed login error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @desc    Refresh user token
 * @route   POST /api/auth/refresh
 * @access  Private
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Create fresh auth response using JWT service
    const authResponse = jwtService.createAuthResponse({
      userId: (user._id as Types.ObjectId).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      englishLevel: user.englishLevel,
      role: user.role,
      score: user.score,
      badge: user.badge
    });

    res.json({
      success: true,
      data: {
        token: authResponse.token,
        user: authResponse.user
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};