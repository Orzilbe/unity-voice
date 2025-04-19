// apps/api/src/routes/learnedWordsRoutes.ts
import { Router } from 'express';
import mongoose from 'mongoose';
import UserProgress from '../models/UserProgress';
import Topic from '../models/Topic';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
  exp?: number;
}

const router = Router();

/**
 * @route   GET /api/learned-words
 * @desc    Get user's learned words, optionally filtered by topic
 * @access  Public
 */
router.get('/', async (req, res) => {
  console.log('[DEBUG] GET /api/learned-words', {
    query: req.query,
    headers: req.headers,
    auth: req.headers.authorization ? 'Present' : 'Missing'
  });

  try {
    const { topic } = req.query;
    
    // Return empty array if no auth header
    if (!req.headers.authorization) {
      console.log('[DEBUG] No auth header, returning empty array');
      return res.json({
        success: true,
        data: []
      });
    }

    try {
      // Verify token manually
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
      
      if (!decoded || !decoded.userId) {
        console.log('[DEBUG] Invalid token or missing userId');
        return res.json({
          success: true,
          data: []
        });
      }

      // Find user progress
      const userProgress = await UserProgress.findOne({ userId: decoded.userId });
      
      if (!userProgress?.learnedWords?.length) {
        console.log('[DEBUG] No learned words found for user');
        return res.json({
          success: true,
          data: []
        });
      }

      console.log('[DEBUG] Found learned words:', userProgress.learnedWords.length);

      // If topic is specified, filter by topic
      let filteredWords = [...userProgress.learnedWords];
      
      if (topic) {
        const topicDoc = await Topic.findOne({ topicName: String(topic) });
        
        if (topicDoc) {
          filteredWords = userProgress.learnedWords.filter(
            word => word.topicId === (topicDoc as any)._id.toString()
          );
          console.log('[DEBUG] Filtered by topic:', {
            topic: topicDoc.topicName,
            filtered: filteredWords.length
          });
        }
      }
      
      res.json({
        success: true,
        data: filteredWords
      });
    } catch (err) {
      const error = err as Error;
      console.log('[DEBUG] Token validation error:', error.message);
      return res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('[DEBUG] Error in learned words route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch learned words'
    });
  }
});

export default router;