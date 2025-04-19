// apps/api/src/controllers/userController.ts
import { Request, Response } from 'express';
import User from '../models/User';
import UserInLevel from '../models/UserInLevel';
import { EnglishLevel, AgeRange } from '@unity-voice/types';
import { Types } from 'mongoose';

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const user = await User.findById(userId);

    if (user) {
      res.json({
        success: true,
        data: {
          id: user._id,
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          ageRange: user.ageRange,
          englishLevel: user.englishLevel,
          profilePicture: user.profilePicture,
          score: user.score,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          badge: user.badge
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req: Request, res: Response) => {
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

    // Update fields if they exist in request body
    const { firstName, lastName, phoneNumber, ageRange, englishLevel, profilePicture } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (ageRange) {
      // וידוא שהערך שייך ל-enum
      if (Object.values(AgeRange).includes(ageRange as AgeRange)) {
        user.ageRange = ageRange;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid ageRange value'
        });
      }
    }
    if (englishLevel) {
      // וידוא שהערך שייך ל-enum
      if (Object.values(EnglishLevel).includes(englishLevel as EnglishLevel)) {
        user.englishLevel = englishLevel;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid englishLevel value'
        });
      }
    }
    if (profilePicture) user.profilePicture = profilePicture;

    const updatedUser = await user.save();

    // עדכון מסמך ההתקדמות אם קיים
    if (englishLevel) {
      const userInLevel = await UserInLevel.findOne({ userId });
      if (userInLevel) {
        userInLevel.englishLevel = englishLevel as EnglishLevel;
        await userInLevel.save();
      }
    }

    res.json({
      success: true,
      data: {
        id: updatedUser._id,
        userId: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        ageRange: updatedUser.ageRange,
        englishLevel: updatedUser.englishLevel,
        profilePicture: updatedUser.profilePicture,
        score: updatedUser.score,
        role: updatedUser.role,
        badge: updatedUser.badge
      }
    });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get user progress by topic
 * @route   GET /api/users/progress/:topicId
 * @access  Private
 */
export const getUserInLevelByTopic = async (req: Request, res: Response) => {
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

    const { topicId } = req.params;
    
    // Get user progress document
    const userInLevel = await UserInLevel.findOne({ userId });
    
    if (!userInLevel) {
      return res.status(404).json({
        success: false,
        error: 'No progress found for this user'
      });
    }
    
    // Find topic progress
    const topicProgress = userInLevel.topic.find(topic => topic.topicId === topicId);
    
    if (!topicProgress) {
      return res.status(404).json({
        success: false,
        error: 'No progress found for this topic'
      });
    }

    res.json({
      success: true,
      data: {
        userId: userInLevel.userId,
        userEmail: userInLevel.userId,
        topicId: topicProgress.topicId,
        topicName: topicProgress.topicName,
        completed: topicProgress.completed,
        completedAt: topicProgress.completedAt,
        earnedScore: topicProgress.earnedScore,
        currentLevel: topicProgress.currentLevel,
        levels: topicProgress.levels.map(level => ({
          level: level.level,
          topicId: level.topicId,
          levelId: level.levelId,
          completed: level.completed,
          completedAt: level.completedAt,
          earnedScore: level.earnedScore,
          createdAt: level.createdAt,
          tasks: level.tasks.map(task => ({
            taskId: task.taskId,
            type: task.type,
            completed: task.completed,
            score: task.score,
            attempts: task.attempts,
            lastAttempt: task.lastAttempt
          }))
        }))
      }
    });
  } catch (error) {
    console.error('Error in getUserProgressByTopic:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get all user progress
 * @route   GET /api/users/progress
 * @access  Private
 */
export const getAllUserProgress = async (req: Request, res: Response) => {
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

    // Get user progress document
    const userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        error: 'No progress found for this user'
      });
    }

    // Map topic to a standardized format
    const topicProgressData = userProgress.topic.map(topic => {
      // Calculate completed levels count
      const completedLevels = topic.levels.filter(level => level.completed).length;
      
      // Calculate total tasks completed
      const totalChallenges = topic.levels.reduce((sum, level) => {
        return sum + level.tasks.filter(task => task.completed).length;
      }, 0);
      
      return {
        topicId: topic.topicId,
        topicName: topic.topicName,
        completed: topic.completed,
        completedAt: topic.completedAt,
        earnedScore: topic.earnedScore,
        currentLevel: topic.currentLevel,
        completedLevels,
        totalChallenges,
        levels: topic.levels.map(level => ({
          level: level.level,
          completed: level.completed,
          earnedScore: level.earnedScore,
          completedAt: level.completedAt,
          tasksCompleted: level.tasks.filter(c => c.completed).length,
          totalChallenges: level.tasks.length
        }))
      };
    });

    res.json({
      success: true,
      data: {
        userId: userProgress.userId,
        userEmail: userProgress.userEmail,
        totalPoints: userProgress.totalPoints,
        englishLevel: userProgress.englishLevel,
        rank: userProgress.rank,
        lastActivityDate: userProgress.lastActivityDate,
        topic: topicProgressData
      }
    });
  } catch (error) {
    console.error('Error in getAllUserProgress:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/users/password
 * @access  Private
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // בדיקת חוזק הסיסמה
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get user badge info and next badge
 * @route   GET /api/users/badges
 * @access  Private
 */
export const getUserBadges = async (req: Request, res: Response) => {
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

    // חישוב מידע על התג הנוכחי והבא באמצעות הפונקציה calculateBadgeProgress
    const { calculateBadgeProgress } = require('@unity-voice/types');
    const badgeProgress = calculateBadgeProgress(user.score || 0);

    res.json({
      success: true,
      data: badgeProgress
    });
  } catch (error) {
    console.error('Error in getUserBadges:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};