// apps/api/src/routes/userProgressRoutes.ts
import express from 'express';
import { protect } from '../middlewares/auth';
import {
  getUserProgress,
  updateUserProgress,
  updateLevelProgress,
  updateChallengeProgress
} from '../controllers/userProgressController';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Get user progress
router.get('/:userId', getUserProgress);

// Update user progress
router.put('/:userId', updateUserProgress);

// Update level progress
router.put('/:userId/levels/:levelId', updateLevelProgress);

// Update task progress
router.put('/:userId/levels/:levelId/tasks/:taskId', updateChallengeProgress);

export default router; 