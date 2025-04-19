// 1. MODIFIED index.ts WITH DEBUG CHECKS
// apps/api/src/routes/index.ts
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import authRoutes from './auth';
import userRoutes from './user';
import topicRoutes from './topic';
import taskRoutes from './tasks';
import progressRoutes from './progress';
import generateWordsHandler from './generateWords';
import saveLearnedWordsHandler from './saveLearnedWords';
import { protect, optional } from '../middlewares/auth';
import Task from '../models/Task';
import WordInTask from '../models/WordInTask';
import Flashcard from '../models/Flashcard';
import Topic from '../models/Topic';
import UserProgress from '../models/UserProgress';

const router = Router();

// Global debug middleware to trace all requests
router.use((req, res, next) => {
  console.log(`🔍 [REQUEST] ${req.method} ${req.originalUrl} - Auth: ${req.headers.authorization ? 'Yes' : 'No'}`);
  next();
});

// Add direct routes for flashcards without going through route files
router.get('/flashcards', async (req, res) => {
  console.log('⭐ DIRECT FLASHCARDS ROUTE HIT ⭐');
  console.log('Query:', req.query);
  console.log('Auth:', req.headers.authorization ? 'Present' : 'Missing');
  
  try {
    const { topic, level = 1 } = req.query;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }
    
    // Find topic by name
    const topicDoc = await Topic.findOne({ 
      topicName: String(topic)
    });
    
    if (!topicDoc) {
      console.log(`Topic not found: ${topic}`);
      return res.status(404).json({
        success: false,
        error: 'Topic not found'
      });
    }
    
    // Get flashcards for the topic and level
    const flashcards = await Flashcard.find({ 
      topicId: topicDoc._id,
      level: Number(level) || 1
    }).select('word translation level');

    console.log(`Found ${flashcards.length} flashcards for topic ${topic} at level ${level}`);
    
    // Check if there are flashcards and log
    if (flashcards.length === 0) {
      console.log(`No flashcards found for topic ${topic} at level ${level}`);
    }
    
    return res.json({
      success: true,
      data: flashcards
    });
  } catch (error) {
    console.error('Error in direct flashcards route:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch flashcards'
    });
  }
});

// Update the learned-words endpoint to return real user data
router.get('/learned-words', async (req, res) => {
  console.log('⭐ DIRECT LEARNED WORDS ROUTE HIT ⭐');
  console.log('Query:', req.query);
  console.log('Auth:', req.headers.authorization ? 'Present' : 'Missing');
  
  try {
    const { topic } = req.query;
    
    // Check authentication - if no token, return empty array
    if (!req.headers.authorization) {
      console.log('No auth token, returning empty array');
      return res.json({
        success: true,
        data: []
      });
    }
    
    try {
      // Extract token from auth header
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };
      
      if (!decoded || !decoded.userId) {
        console.log('Invalid token or missing userId');
        return res.json({
          success: true,
          data: []
        });
      }
      
      // Find user progress
      const userProgress = await UserProgress.findOne({ userId: decoded.userId });
      
      if (!userProgress || !userProgress.learnedWords || userProgress.learnedWords.length === 0) {
        console.log('No learned words found for user');
        return res.json({
          success: true,
          data: []
        });
      }
      
      let learnedWords = userProgress.learnedWords;
      
      // Filter by topic if specified
      if (topic) {
        const topicDoc = await Topic.findOne({ topicName: String(topic) });
        
        if (topicDoc) {
          learnedWords = learnedWords.filter(word => 
            word.topicId.toString() === topicDoc._id.toString()
          );
        }
      }
      
      console.log(`Returning ${learnedWords.length} learned words for user ${decoded.userId}`);
      
      return res.json({
        success: true,
        data: learnedWords
      });
    } catch (error) {
      console.log('Token validation error:', error);
      // In case of auth error, return empty array
      return res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('Error in learned words route:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch learned words'
    });
  }
});

// Add endpoint to save learned words
router.post('/learned-words', async (req, res) => {
  console.log('⭐ SAVE LEARNED WORDS ROUTE HIT ⭐');
  console.log('Body:', req.body);
  console.log('Auth:', req.headers.authorization ? 'Present' : 'Missing');

  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication'
      });
    }

    const { wordId, topicId, timestamp } = req.body;

    if (!wordId || !topicId) {
      return res.status(400).json({
        success: false,
        error: 'wordId and topicId are required'
      });
    }

    // Find or create user progress
    let userProgress = await UserProgress.findOne({ userId: decoded.userId });

    if (!userProgress) {
      userProgress = new UserProgress({
        userId: decoded.userId,
        learnedWords: []
      });
    }

    // Check if word is already learned
    const isWordLearned = userProgress.learnedWords.some(
      word => word.wordId === wordId && word.topicId === topicId
    );

    if (!isWordLearned) {
      userProgress.learnedWords.push({
        wordId,
        topicId,
        timestamp: timestamp || new Date().toISOString()
      });

      await userProgress.save();
      console.log(`Saved new learned word for user ${decoded.userId}: ${wordId}`);
    } else {
      console.log(`Word ${wordId} already learned for user ${decoded.userId}`);
    }

    return res.json({
      success: true,
      data: userProgress.learnedWords
    });
  } catch (error) {
    console.error('Error saving learned word:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save learned word'
    });
  }
});

// Standard routes
router.post('/generate-words', protect, generateWordsHandler);
router.post('/save-learned-words', protect, saveLearnedWordsHandler);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/topic', topicRoutes);
router.use('/tasks', taskRoutes);
router.use('/progress', progressRoutes);

// Legacy endpoint - keep for reference
router.get('/user-learned-words', protect, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { topic } = req.query;

    // Get all tasks for this user
    const tasks = await Task.find({ 
      userId: req.user.userId,
      ...(topic ? { topic } : {})
    });

    const taskIds = tasks.map(task => task.taskId);

    // Get all words learned in these tasks
    const learnedWords = await WordInTask.find({
      taskId: { $in: taskIds }
    });

    return res.status(200).json({
      success: true,
      data: learnedWords
    });
  } catch (error) {
    console.error('Error fetching learned words:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching learned words'
    });
  }
});

export default router;