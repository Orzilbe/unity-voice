// apps/api/src/routes/userRoutes.ts
import express from 'express';
import { protect } from '../middlewares/auth';
import { getUserProfile } from '../controllers/userController';
import User from '../models/User';
import UserInLevel from '../models/UserInLevel';
import { EnglishLevel, Badge, BadgeType, calculateBadgeProgress } from '@unity-voice/types';
import Flashcard from '../models/Flashcard';
import UserLearnedWord from '../models/UserLearnedWord';
import Topic from '../models/Topic';
import mongoose from 'mongoose';
// Define IUserRequest interface locally
interface JWTPayload {
  userId: string;
  email: string;
  roles?: string[];
  exp?: number;
}

interface IUserRequest extends express.Request {
  user?: JWTPayload;
}

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.get('/user-data', protect, async (req: IUserRequest, res) => {
  try {
    const userId = req.user?.userId;
    
    // Find user in database
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Find user progress
    const userProgress = await UserInLevel.findOne({ userId });
    
    // Calculate points
    const points = user.totalScore || 0;
    
    // Calculate badge progress
    const badgeProgress = calculateBadgeProgress(points);
    const currentBadge = badgeProgress.currentBadge;
    
    // Format data to match frontend expectations
    const userData = {
      data: {
        id: user._id,
        level: userProgress?.level || 1,
        points: points,
        totalScore: userProgress?.EarnedScore || 0,
        completedTasks: userProgress?.completedAt ? 1 : 0,
        activeSince: user.createdAt 
          ? new Date(user.createdAt).toLocaleDateString() 
          : 'New User',
        nextLevel: (userProgress?.level || 1) + 1,
        pointsToNextLevel: 100 - (points % 100),
        englishLevel: user.englishLevel || EnglishLevel.BEGINNER,
        currentBadge,
        progress: userProgress ? [{
          topicName: userProgress.topic.topicName,
          completed: userProgress.completedAt,
          score: userProgress.EarnedScore,
        }] : [],
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        ageRange: user.ageRange,
        createdAt: user.createdAt,
        score: points
      }
    };
    
    return res.status(200).json(userData);
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});
router.get('/user-topic-progress', protect, async (req: IUserRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        data: []
      });
    }

    // Find all user level records for this user
    const userLevelRecords = await UserInLevel.find({ userId });

    // Format the data for the frontend
    const topicProgress = userLevelRecords.map(record => ({
      topicName: record.topic.topicName,
      currentLevel: record.level,
      earnedScore: record.EarnedScore,
      completed: record.completedAt
    }));

    return res.json({
      success: true,
      data: topicProgress
    });
  } catch (error) {
    console.error('Error fetching user topic progress:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user topic progress',
      data: []
    });
  }
});
router.get('/user-topic-level', protect, async (req: IUserRequest, res) => {
  try {
    const { topicName } = req.query;
    const userId = req.user?.userId;

    if (!userId || !topicName) {
      return res.status(400).json({
        success: false,
        error: 'User ID and topic name are required',
        level: 1
      });
    }

    // Find the highest level the user has for this topic
    const userLevelRecord = await UserInLevel.findOne({
      userId,
      'topic.topicName': topicName
    }).sort({ level: -1 }); // Sort by level in descending order

    // If no record found, default to level 1
    const highestLevel = userLevelRecord ? userLevelRecord.level : 1;

    return res.json({
      success: true,
      level: highestLevel
    });
  } catch (error) {
    console.error('Error fetching user topic level:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user topic level',
      level: 1
    });
  }
});
router.get('/post/words/:topicName', protect, async (req: IUserRequest, res) => {
  try {
    const { topicName } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        words: []
      });
    }

    // Find topic ID from the topic name
    const topic = await Topic.findOne({ topicName });
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found',
        words: []
      });
    }

    const topicId = (topic as { _id: mongoose.Types.ObjectId })._id.toString();
    
    // Find words that the user has learned for this topic
    const learnedWords = await UserLearnedWord.find({
      userId,
      topicId
    }).sort({ learnedAt: -1 });
    
    if (learnedWords.length === 0) {
      return res.json({
        success: true,
        message: 'No learned words found for this topic',
        words: []
      });
    }

    // Get the actual flashcard data for these learned words
    const wordIds = learnedWords.map((word: any) => word.flashcardId);
    const flashcards = await Flashcard.find({
      _id: { $in: wordIds }
    });
    
    // Extract just the English words
    const words = flashcards.map((card: any) => card.word);
    
    // If we found fewer than 5 words, add some default words
    const defaultWords = ['Commander', 'Shield', 'Enemy', 'Tactics', 'Battlefield'];
    let finalWords = [...words];
    
    if (finalWords.length < 5) {
      // Add default words that aren't already in the list
      const missingCount = 5 - finalWords.length;
      const additionalWords = defaultWords
        .filter(word => !finalWords.includes(word))
        .slice(0, missingCount);
        
      finalWords = [...finalWords, ...additionalWords];
    }
    
    // Pick 5 random words if we have more than 5
    if (finalWords.length > 5) {
      finalWords = finalWords
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
    }

    return res.json({
      success: true,
      words: finalWords
    });
  } catch (error) {
    console.error('Error fetching post words:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch learned words for post',
      words: []
    });
  }
});
export default router;