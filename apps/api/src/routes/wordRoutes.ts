// apps/api/src/routes/wordRoutes.ts
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { OpenAIClient } from '../services/openai';
import { protect } from '../middlewares/auth';
import Topic, { ITopic } from '../models/Topic';
import TopicWordStack from '../models/TopicWordStack';
import UserProgress, { IUserProgress } from '../models/UserProgress';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types/auth';

// Extend the Request type with our TokenPayload
interface RequestWithUser extends Request {
  user?: TokenPayload;
}

interface LearnedWord {
  word: string;
  topicId: string | number;
  learnedAt: Date;
}

const router = Router();
const openaiClient = new OpenAIClient();

// Get next batch of words for a topic
router.get('/topic-words', async (req, res) => {
  try {
    const { topicName, level = 1 } = req.query;
    
    if (!topicName) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }
    
    // Find topic by name
    const topic = await Topic.findOne({ name: String(topicName) });
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found'
      });
    }

    const topicId = topic._id as mongoose.Types.ObjectId;
    
    // Get word stack for this topic and level
    const wordStack = await TopicWordStack.findOne({
      topicId,
      level: Number(level)
    });
    
    if (!wordStack || !wordStack.words || wordStack.words.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // If user is authenticated, filter out words they've already learned
    let wordsToReturn = [...wordStack.words];
    
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
        
        if (decoded.userId) {
          const userProgress = await UserProgress.findOne({ userId: decoded.userId });
          
          if (userProgress?.wordsLearned?.length) {
            // Filter out words the user has already learned
            wordsToReturn = wordStack.words.filter(word => 
              !userProgress.wordsLearned?.some((learned) => 
                learned.word === word.word && 
                learned.topicId.toString() === topicId.toString()
              )
            );
          }
        }
      } catch (err) {
        console.log('Token validation error, returning all words');
      }
    }
    
    // Return the first 7 words (or all if less than 7)
    const result = wordsToReturn.slice(0, 7);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching topic words:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch topic words'
    });
  }
});

// Mark a word as learned
router.post('/learned-words', protect, async (req: RequestWithUser, res: Response) => {
  try {
    const { flashcardId, word, topicId } = req.body;
    
    if (!flashcardId || !word || !topicId) {
      return res.status(400).json({
        success: false,
        error: 'flashcardId, word, and topicId are required'
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    // Find or create user progress
    let userProgress = await UserProgress.findOne({ userId: req.user.userId });
    
    if (!userProgress) {
      userProgress = new UserProgress({
        userId: req.user.userId,
        topics: [],
        wordsLearned: [],
        totalPoints: 0,
        englishLevel: 'intermediate',
        lastActivityDate: new Date()
      });
    }
    
    // Check if word is already learned
    const alreadyLearned = userProgress.wordsLearned?.some(
      (learned) => learned.word === word && learned.topicId.toString() === topicId
    ) || false;
    
    if (!alreadyLearned) {
      // Add to learned words
      if (!userProgress.wordsLearned) {
        userProgress.wordsLearned = [];
      }
      userProgress.wordsLearned.push({
        word,
        topicId,
        learnedAt: new Date()
      });
      
      // Update last activity date
      userProgress.lastActivityDate = new Date();
      
      await userProgress.save();
    }
    
    return res.json({
      success: true,
      data: userProgress.wordsLearned,
      message: alreadyLearned ? 'Word was already learned' : 'Word marked as learned'
    });
  } catch (error) {
    console.error('Error saving learned word:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save learned word'
    });
  }
});

// Legacy endpoint for OpenAI word generation
router.post('/generate-words', protect, async (req: RequestWithUser, res: Response) => {
  try {
    const result = await openaiClient.generateContent(req.body);
    return res.json(result);
  } catch (error) {
    console.error('Error generating words:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate words'
    });
  }
});

export default router;