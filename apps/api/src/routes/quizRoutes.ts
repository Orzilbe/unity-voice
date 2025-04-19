// apps/api/src/routes/quizRoutes.ts
import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middlewares/auth';
import UserLearnedWord from '../models/UserLearnedWord';
import Flashcard from '../models/Flashcard';
import Topic from '../models/Topic';

interface JWTPayload {
  userId: string;
  email: string;
  exp?: number;
}

interface IUserRequest extends express.Request {
  user?: JWTPayload;
}

interface QuizWord {
  id: string;
  word: string;
  correctAnswer: string;
  options?: string[];
}

interface ITopic {
  _id: mongoose.Types.ObjectId;
  topicName: string;
}

interface IFlashcard {
  _id: mongoose.Types.ObjectId;
  word: string;
  translation: string;
  topicId: string;
  level: number;
}

const router = express.Router();

/**
 * @route   GET /api/quiz/words/:topicName/:level
 * @desc    Get learned words for quiz
 * @access  Protected
 */
router.get('/words/:topicName/:level', protect, async (req: IUserRequest, res) => {
    try {
      const { topicName, level } = req.params;
      const userId = req.user?.userId;
  
      console.log('Quiz words requested:', { topicName, level, userId });
  
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }
  
      // Find topic by name
      const topic = await Topic.findOne({ topicName }) as (mongoose.Document & ITopic) | null;
      console.log('Topic found:', topic ? 'yes' : 'no', topic?._id.toString());
      
      if (!topic) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found'
        });
      }
  
      // Get topic ID
      const topicId = topic._id.toString();
      
      // Find learned words
      const learnedWords = await UserLearnedWord.find({
        userId,
        topicId: topicId
      }).sort({ learnedAt: -1 }).limit(7);
      
      console.log('Learned words found:', learnedWords.length);
      
      if (learnedWords.length === 0) {
        return res.json({
          success: true,
          message: 'No learned words found for this topic',
          data: []
        });
      }
  
      // Get the actual flashcard data for these learned words
      const wordIds = learnedWords.map(word => word.flashcardId);
      console.log('Word IDs to search for:', wordIds);
      
      const flashcards = await Flashcard.find({
        _id: { $in: wordIds }
      }) as (mongoose.Document & IFlashcard)[];
      
      console.log('Flashcards found:', flashcards.length);
      
      if (flashcards.length === 0) {
        console.log('No flashcards found for the learned words');
        return res.json({
          success: true,
          message: 'No flashcard data found for learned words',
          data: []
        });
      }
  
      // Format the data for the quiz
      const quizWords: QuizWord[] = flashcards.map(card => ({
        id: card._id.toString(),
        word: card.word,
        correctAnswer: card.translation,
        options: []
      }));
      
      console.log('Quiz words created:', quizWords.length);
  
      // For each quiz word, add options (including the correct answer)
      for (let i = 0; i < quizWords.length; i++) {
        // Get 3 random other translations
        const otherTranslations = flashcards
          .filter(card => card._id.toString() !== quizWords[i].id)
          .map(card => card.translation)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
  
        // Add the correct answer and shuffle
        const options = [...otherTranslations, quizWords[i].correctAnswer]
          .sort(() => 0.5 - Math.random());
  
        quizWords[i].options = options;
      }
      
      console.log('Final quiz data with options:', quizWords.length > 0);
  
      return res.json({
        success: true,
        data: quizWords
      });
    } catch (error) {
      console.error('Error fetching quiz words:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch quiz words'
      });
    }
  });

export default router;