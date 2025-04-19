// apps/api/src/routes/topic.ts
import { Router } from 'express';
import Topic from '../models/Topic';
import { ITopic } from '../models/Topic';
import Level, { ILevel, ITask } from '../models/Level';
import UserProgress, { IUserProgress } from '../models/UserProgress';
import { protect, optional } from '../middlewares/auth';
import { Types } from 'mongoose';
import { authenticateToken } from '../middlewares/auth';
import { ITopicProgress as ITopicProgressType, ILevelProgress as ILevelProgressType } from '@unity-voice/types';

const router = Router();

// Standard response interfaces
interface ISuccessResponse<T> {
  success: true;
  data: T;
}

interface IErrorResponse {
  success: false;
  error: string;
  details?: any;
}

interface ITopicWithLevels extends ITopic {
  levels?: any[]; // או טיפוס ספציפי יותר
  progress?: any;
}

interface ITopicWithProgress extends ITopic {
  progress?: {
    earnedScore: number;
    levels: ILevelProgressType[];
  };
}

interface TokenPayload {
  userId: string;
}

interface IUserProgressTopic {
  topicId: string;
  progress: number;
  completedLevels: string[];
  tasks?: {
    [key: string]: {
      completed: boolean;
      score?: number;
      attempts?: number;
      earnedScore?: number;
      lastAttempt?: Date;
      completedAt?: Date;
    };
  };
}

interface ITopicProgress {
  topicId: Types.ObjectId;
  progress: number;
  completedLevels: string[];
  tasks?: {
    [key: string]: {
      completed: boolean;
      score?: number;
      attempts?: number;
      earnedScore?: number;
      lastAttempt?: Date;
      completedAt?: Date;
    };
  };
}

interface ILevelProgress {
  levelId: Types.ObjectId;
  completed: boolean;
  earnedScore: number;
  completedAt: Date;
}

/**
 * @route   GET /api/topics
 * @desc    Get all topics with user progress if authenticated
 * @access  Public (with optional auth for progress data)
 */
router.get('/', protect, async (req, res) => {
  try {
    const topic = await Topic.find().sort({ order: 1 });
    const userProgress = await UserProgress.findOne({ userId: (req.user as TokenPayload).userId });

    const topicWithProgress = topic.map((topic) => {
      const topicObj = topic.toObject() as ITopic & { _id: Types.ObjectId };
      const topicId = topicObj._id.toString();
      const progressData = userProgress?.topics?.find((t: ITopicProgressType) => t.topicId.toString() === topicId) as IUserProgressTopic | undefined;
      
      return {
        ...topicObj,
        progress: progressData?.progress || 0,
        completedLevels: progressData?.completedLevels || []
      } as ITopicWithProgress;
    });

    res.json({
      success: true,
      data: topicWithProgress
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch topics' });
  }
});

/**
 * @route   GET /api/topics/:topicId
 * @desc    Get a single topic with levels and user progress
 * @access  Public (with optional auth for progress data)
 */
router.get('/:topicId', optional, async (req, res) => {
  try {
    const { topicId } = req.params;
    
    // Validate ID format
    if (!isValidId(topicId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid topic ID format'
      });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ 
        success: false,
        error: 'Topic not found' 
      });
    }

    // Get levels for this topic
    const levels = await Level.find({ topicId }).sort({ order: 1 });

    // Basic topic data without progress
    let topicData = transformTopic(topic) as ITopicWithLevels;
    
    // Add levels with basic data
    topicData.levels = levels.map(level => ({
      _id: level._id,
      topicId: level.topicId,
      order: level.order,
      title: level.title,
      description: level.description,
      tasks: level.tasks.map(task => ({
        _id: task._id,
        type: task.type,
        content: task.content,
        difficulty: task.difficulty,
        points: task.points,
        timeLimit: task.timeLimit,
        progress: null
      })),
      requiredScore: level.requiredScore,
      isLocked: level.isLocked,
      progress: null
    }));

    // Add progress data if authenticated
    if (req.user) {
      const userProgress = await UserProgress.findOne({ userId: req.user.userId });
      
      if (userProgress) {
        const topicProgress = userProgress.topics?.find((t: ITopicProgressType) => t.topicId.toString() === topicId);
        
        if (topicProgress) {
          topicData.progress = {
            earnedScore: topicProgress.earnedScore,
            levels: topicProgress.levels
          };
          
          topicData.levels = topicData.levels.map((level: any) => {
            const levelId = level._id.toString();
            const levelProgress = topicProgress.levels?.find((l: ILevelProgressType) => l.levelId.toString() === levelId);
            
            if (levelProgress) {
              return {
                ...level,
                progress: {
                  earnedScore: levelProgress.earnedScore,
                  completedAt: levelProgress.completedAt
                }
              };
            }
            return level;
          });
        }
      }
    }

    res.json({
      success: true,
      data: topicData
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching topic details',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   GET /api/topics/:topicId/levels
 * @desc    Get all levels for a topic
 * @access  Public
 */
router.get('/:topicId/levels', async (req, res) => {
  try {
    const { topicId } = req.params;
    
    // Validate ID format
    if (!isValidId(topicId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid topic ID format'
      });
    }

    const levels = await Level.find({ topicId }).sort({ order: 1 });
    
    res.json({
      success: true,
      data: levels.map(level => ({
        _id: level._id,
        topicId: level.topicId,
        order: level.order,
        title: level.title,
        description: level.description,
        requiredScore: level.requiredScore,
        isLocked: level.isLocked,
        taskCount: level.tasks.length
      }))
    });
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching levels',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   GET /api/topics/:topicId/levels/:levelId
 * @desc    Get a specific level with tasks
 * @access  Public (with optional auth for progress data)
 */
router.get('/:topicId/levels/:levelId', optional, async (req, res) => {
  try {
    const { topicId, levelId } = req.params;
    
    // Validate ID formats
    if (!isValidId(topicId) || !isValidId(levelId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }

    const level = await Level.findOne({ 
      _id: levelId,
      topicId
    });
    
    if (!level) {
      return res.status(404).json({ 
        success: false,
        error: 'Level not found' 
      });
    }
    
    // Basic level data
    const levelData = {
      _id: level._id,
      topicId: level.topicId,
      order: level.order,
      title: level.title,
      description: level.description,
      tasks: level.tasks.map(task => ({
        _id: task._id,
        type: task.type,
        content: task.content,
        difficulty: task.difficulty,
        points: task.points,
        timeLimit: task.timeLimit,
        progress: null
      })),
      requiredScore: level.requiredScore,
      isLocked: level.isLocked,
      progress: null
    };
    
    // Add progress data if authenticated
    if (req.user) {
      const userProgress = await UserProgress.findOne({ userId: req.user.userId });
      
      if (userProgress) {
        const topicProgress = userProgress.topics?.find((t: ITopicProgressType) => t.topicId.toString() === topicId);
        
        if (topicProgress) {
          const levelProgress = topicProgress.levels?.find((l: ILevelProgressType) => l.levelId.toString() === levelId);
          
          if (levelProgress) {
            // Add progress to level
            levelData.progress = {
              completed: levelProgress.completed,
              earnedScore: levelProgress.earnedScore,
              completedAt: levelProgress.completedAt
            };
            
            // Add progress to tasks
            levelData.tasks = levelData.tasks.map(task => {
              const taskId = task._id.toString();
              const taskProgress = levelProgress.tasks?.find(t => t.taskId.toString() === taskId);
              
              if (taskProgress) {
                task.progress = {
                  completed: taskProgress.completed,
                  score: taskProgress.score,
                  attempts: taskProgress.attempts,
                  lastAttempt: taskProgress.lastAttempt
                };
              }
              
              return task;
            });
          }
        }
      }
    }
    
    res.json({
      success: true,
      data: levelData
    });
  } catch (error) {
    console.error('Error fetching level:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching level details',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Helper functions

/**
 * Validates if a string is a valid MongoDB ObjectId
 */
function isValidId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Transforms a topic document to a standardized response format
 */
function transformTopic(topic: ITopic, progress?: ITopicProgressType) {
  return {
    _id: topic._id,
    topicName: topic.topicName,
    topicHe: topic.topicHe,
    icon: topic.icon,
    order: topic.order || 0,
    difficulty: topic.difficulty || 'beginner',
    description: topic.description || '',
    descriptionHe: topic.descriptionHe || '',
    progress: progress ? {
      completed: progress.completed,
      earnedScore: progress.earnedScore,
      currentLevel: progress.currentLevel,
      completedAt: progress.completedAt
    } : null
  };
}

export default router;