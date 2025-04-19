// apps/api/src/routes/userTopicProgress.ts
import express from 'express';
import UserInLevel from '../models/UserInLevel';
import Topic from '../models/Topic';
import { protect } from '../middlewares/auth';

const router = express.Router();

// GET user's topic progress
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userProgress = await UserInLevel.find({ userId });
    
    res.json({
      success: true,
      data: userProgress
    });
  } catch (error) {
    console.error('Error fetching user topic progress:', error);
    res.status(500).json({ 
      message: 'Error fetching user topic progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;