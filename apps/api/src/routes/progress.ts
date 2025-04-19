// apps/api/src/routes/progress.ts
import { Router } from 'express';
import { protect } from '../middlewares/auth';
import UserProgress, { 
  ITopicProgress,
  ILevelProgress,
  ITaskProgress
} from '../models/UserProgress';
import Topic from '../models/Topic';
import Level from '../models/Level';
import mongoose from 'mongoose';

const router = Router();

/**
 * @route   GET /api/progress
 * @desc    Get complete user progress
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        error: 'No progress found for this user'
      });
    }

    res.json({
      success: true,
      data: userProgress
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user progress',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   GET /api/progress/topic/:topicId
 * @desc    Get user progress for a specific topic
 * @access  Private
 */
router.get('/topic/:topicId', protect, async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    // Validate topic ID
    if (!isValidId(topicId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid topic ID format'
      });
    }

    const userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        error: 'No progress found for this user'
      });
    }

    const topicProgress = userProgress.topic?.find(t => t.topicId.toString() === topicId);
    
    if (!topicProgress) {
      return res.status(404).json({
        success: false,
        error: 'No progress found for this topic'
      });
    }

    res.json({
      success: true,
      data: topicProgress
    });
  } catch (error) {
    console.error('Error fetching topic progress:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching topic progress',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   PUT /api/progress/topic/:topicId/levels/:levelId
 * @desc    Update level progress
 * @access  Private
 */
router.put('/topic/:topicId/levels/:levelId', protect, async (req, res) => {
  try {
    const { topicId, levelId } = req.params;
    const userId = req.user?.userId;
    const { completed, earnedScore } = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    // Validate IDs
    if (!isValidId(topicId) || !isValidId(levelId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }

    // Find the user progress document
    let userProgress = await UserProgress.findOne({ userId });
    
    // If no progress exists yet, create a new one
    if (!userProgress) {
      userProgress = await initializeUserProgress(userId);
    }

    // Find the topic progress
    let topicProgress = userProgress.topic?.find(t => t.topicId.toString() === topicId);
    
    // If no topic progress exists, add it
    if (!topicProgress) {
      // Check if topic exists
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found'
        });
      }
      
      // Add new topic progress
      const newTopicProgress: ITopicProgress = {
        topicId,
        completed: false,
        earnedScore: 0,
        currentLevel: 1,
        startedAt: new Date(),
        levels: []
      };
      
      userProgress.topic.push(newTopicProgress);
      topicProgress = newTopicProgress;
    }

    // Find the level progress
    let levelProgress = topicProgress.levels?.find(l => l.levelId.toString() === levelId);
    
    // If no level progress exists, add it
    if (!levelProgress) {
      // Check if level exists
      const level = await Level.findById(levelId);
      if (!level) {
        return res.status(404).json({
          success: false,
          error: 'Level not found'
        });
      }
      
      // Add new level progress
      const newLevelProgress: ILevelProgress = {
        levelId,
        completed: false,
        earnedScore: 0,
        startedAt: new Date(),
        tasks: []
      };
      
      // Create tasks array if it doesn't exist
      if (!topicProgress.levels) {
        topicProgress.levels = [];
      }
      
      topicProgress.levels.push(newLevelProgress);
      levelProgress = newLevelProgress;
    }

    // Update level progress
    if (completed !== undefined) {
      levelProgress.completed = completed;
      
      // If level is completed now, add completedAt date
      if (completed && !levelProgress.completedAt) {
        levelProgress.completedAt = new Date();
      }
    }
    
    if (earnedScore !== undefined) {
      levelProgress.earnedScore = earnedScore;
    }
    
    // Check if all levels are completed to update topic completion
    if (topicProgress.levels && topicProgress.levels.length > 0) {
      const allLevelsCompleted = topicProgress.levels.every(level => level.completed);
      
      if (allLevelsCompleted && !topicProgress.completed) {
        topicProgress.completed = true;
        topicProgress.completedAt = new Date();
      }
    }
    
    // Update topic total earned score
    if (topicProgress.levels && topicProgress.levels.length > 0) {
      topicProgress.earnedScore = topicProgress.levels.reduce(
        (total, level) => total + level.earnedScore, 
        0
      );
    }

    // Save changes
    await userProgress.save();

    res.json({
      success: true,
      data: levelProgress
    });
  } catch (error) {
    console.error('Error updating level progress:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating level progress',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   PUT /api/progress/topic/:topicId/levels/:levelId/tasks/:taskId
 * @desc    Update task progress
 * @access  Private
 */
router.put('/topic/:topicId/levels/:levelId/tasks/:taskId', protect, async (req, res) => {
  try {
    const { topicId, levelId, taskId } = req.params;
    const userId = req.user?.userId;
    const { completed, score, attempts, type } = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    // Validate IDs
    if (!isValidId(topicId) || !isValidId(levelId) || !isValidId(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }

    // Find the user progress document
    let userProgress = await UserProgress.findOne({ userId });
    
    // If no progress exists yet, create a new one
    if (!userProgress) {
      userProgress = await initializeUserProgress(userId);
    }

    // Find the topic progress
    let topicIndex = userProgress.topic.findIndex(t => t.topicId.toString() === topicId);
    
    // If no topic progress exists, add it
    if (topicIndex === -1) {
      // Check if topic exists
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          error: 'Topic not found'
        });
      }
      
      // Add new topic progress
      const newTopicProgress: ITopicProgress = {
        topicId,
        completed: false,
        earnedScore: 0,
        currentLevel: 1,
        startedAt: new Date(),
        levels: []
      };
      
      userProgress.topic.push(newTopicProgress);
      topicIndex = userProgress.topic.length - 1;
    }

    // Find the level progress
    let levelIndex = userProgress.topic[topicIndex].levels?.findIndex(l => l.levelId.toString() === levelId);
    
    // If no level progress exists, add it
    if (levelIndex === -1 || levelIndex === undefined) {
      // Check if level exists
      const level = await Level.findById(levelId);
      if (!level) {
        return res.status(404).json({
          success: false,
          error: 'Level not found'
        });
      }
      
      // Add new level progress
      const newLevelProgress: ILevelProgress = {
        levelId,
        completed: false,
        earnedScore: 0,
        startedAt: new Date(),
        tasks: []
      };
      
      // Create levels array if it doesn't exist
      if (!userProgress.topic[topicIndex].levels) {
        userProgress.topic[topicIndex].levels = [];
      }
      
      userProgress.topic[topicIndex].levels.push(newLevelProgress);
      levelIndex = userProgress.topic[topicIndex].levels.length - 1;
    }

    // Find the task progress
    let taskIndex = userProgress.topic[topicIndex].levels[levelIndex].tasks?.findIndex(t => t.taskId.toString() === taskId);
    
    // If no task progress exists, add it
    if (taskIndex === -1 || taskIndex === undefined) {
      // Check if task exists within the level
      const level = await Level.findById(levelId);
      const taskExists = level?.tasks.some(t => t._id.toString() === taskId);
      
      if (!taskExists) {
        return res.status(404).json({
          success: false,
          error: 'Task not found in this level'
        });
      }
      
      // Add new task progress
      const newTaskProgress: ITaskProgress = {
        taskId,
        type: type || 'words', // Default to 'words' if not specified
        completed: false,
        score: 0,
        attempts: 0
      };
      
      // Create tasks array if it doesn't exist
      if (!userProgress.topic[topicIndex].levels[levelIndex].tasks) {
        userProgress.topic[topicIndex].levels[levelIndex].tasks = [];
      }
      
      userProgress.topic[topicIndex].levels[levelIndex].tasks.push(newTaskProgress);
      taskIndex = userProgress.topic[topicIndex].levels[levelIndex].tasks.length - 1;
    }

    // Update task progress
    const taskProgress = userProgress.topic[topicIndex].levels[levelIndex].tasks[taskIndex];
    
    if (completed !== undefined) {
      taskProgress.completed = completed;
    }
    
    if (score !== undefined) {
      taskProgress.score = score;
    }
    
    if (attempts !== undefined) {
      taskProgress.attempts = attempts;
    }
    
    // Update lastAttempt timestamp
    taskProgress.lastAttempt = new Date();
    
    // Update task-specific data based on type
    if (req.body.words && taskProgress.type === 'words') {
      taskProgress.wordsLearned = req.body.words;
      
      // Add learned words to the global learned words list
      if (req.body.words && Array.isArray(req.body.words)) {
        req.body.words.forEach((word: any) => {
          if (word.wordId && word.learned) {
            // Check if this word is already in learnedWords
            const existingWord = userProgress.learnedWords?.find(w => w.wordId === word.wordId);
            
            if (!existingWord) {
              userProgress.learnedWords.push({
                wordId: word.wordId,
                topicId,
                learnedAt: new Date()
              });
            }
          }
        });
      }
    }
    
    if (req.body.postId && taskProgress.type === 'post') {
      taskProgress.postId = req.body.postId;
      taskProgress.response = req.body.response;
    }
    
    if (req.body.conversationId && taskProgress.type === 'conversation') {
      taskProgress.conversationId = req.body.conversationId;
      taskProgress.duration = req.body.duration;
    }
    
    // Check if all tasks are completed to update level completion
    if (userProgress.topic[topicIndex].levels[levelIndex].tasks.length > 0) {
      const allTasksCompleted = userProgress.topic[topicIndex].levels[levelIndex].tasks.every(task => task.completed);
      
      if (allTasksCompleted && !userProgress.topic[topicIndex].levels[levelIndex].completed) {
        userProgress.topic[topicIndex].levels[levelIndex].completed = true;
        userProgress.topic[topicIndex].levels[levelIndex].completedAt = new Date();
        
        // Update UserInLevel model as well to maintain backward compatibility
        await updateUserInLevel(userId, topicId, levelIndex + 1, true);
      }
    }
    
    // Update level earned score based on task scores
    userProgress.topic[topicIndex].levels[levelIndex].earnedScore = 
      userProgress.topic[topicIndex].levels[levelIndex].tasks.reduce(
        (total, task) => total + task.score, 
        0
      );
    
    // Check if all levels are completed to update topic completion
    if (userProgress.topic[topicIndex].levels.length > 0) {
      const allLevelsCompleted = userProgress.topic[topicIndex].levels.every(level => level.completed);
      
      if (allLevelsCompleted && !userProgress.topic[topicIndex].completed) {
        userProgress.topic[topicIndex].completed = true;
        userProgress.topic[topicIndex].completedAt = new Date();
      }
    }
    
    // Update topic total earned score
    userProgress.topic[topicIndex].earnedScore = 
      userProgress.topic[topicIndex].levels.reduce(
        (total, level) => total + level.earnedScore, 
        0
      );

    // Save changes
    await userProgress.save();

    res.json({
      success: true,
      data: taskProgress
    });
  } catch (error) {
    console.error('Error updating task progress:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating task progress',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   GET /api/progress/badges
 * @desc    Get user badge info
 * @access  Private
 */
router.get('/badges', protect, async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        error: 'No progress found for this user'
      });
    }

    res.json({
      success: true,
      data: userProgress.badges || []
    });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user badges',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   POST /api/progress/initialize
 * @desc    Initialize user progress for all topic
 * @access  Private
 */
router.post('/initialize', protect, async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    // Check if progress already exists
    const existingProgress = await UserProgress.findOne({ userId });
    
    if (existingProgress) {
      return res.status(400).json({
        success: false,
        error: 'User progress already initialized'
      });
    }

    const userProgress = await initializeUserProgress(userId);

    res.json({
      success: true,
      data: userProgress
    });
  } catch (error) {
    console.error('Error initializing user progress:', error);
    res.status(500).json({
      success: false,
      error: 'Error initializing user progress',
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
 * Initialize user progress for all topic
 */
async function initializeUserProgress(userId: string) {
  // Get all topic
  const topic = await Topic.find().sort({ order: 1 });
  
  // Create initial progress data
  const userProgress = new UserProgress({
    userId,
    topic: topic.map(topic => ({
      topicId: topic._id,
      completed: false,
      earnedScore: 0,
      currentLevel: 1,
      startedAt: new Date(),
      levels: []
    })),
    learnedWords: [],
    badges: [],
    stats: {
      totalScore: 0,
      totalTopicsCompleted: 0,
      totalLevelsCompleted: 0,
      totalTasksCompleted: 0,
      totalWordsLearned: 0,
      totalConversations: 0,
      totalPosts: 0,
      lastActivityAt: new Date()
    }
  });
  
  // Save and return the new user progress
  return await userProgress.save();
}

/**
 * Update UserInLevel model for backward compatibility
 */
async function updateUserInLevel(userId: string, topicId: string, level: number, isCompleted: boolean) {
  try {
    // Get topic data
    const topic = await Topic.findById(topicId);
    
    if (!topic) {
      return;
    }
    
    // Try to find existing record
    let userInLevel = await mongoose.model('UserInLevel').findOne({ 
      userId, 
      'topic.topicName': topic.topicName 
    });
    
    if (userInLevel) {
      // Update existing record
      userInLevel.level = level;
      userInLevel.IsCompleted = isCompleted;
      
      if (isCompleted) {
        userInLevel.completedAt = new Date();
      }
      
      await userInLevel.save();
    } else {
      // Create new record
      userInLevel = new mongoose.model('UserInLevel')({
        userId,
        level,
        topic: {
          topicName: topic.topicName,
          topicHe: topic.topicHe,
          icon: topic.icon
        },
        IsCompleted: isCompleted,
        completedAt: isCompleted ? new Date() : undefined
      });
      
      await userInLevel.save();
    }
  } catch (error) {
    console.error('Error updating UserInLevel:', error);
  }
}

export default router;