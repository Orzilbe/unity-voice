// apps/api/src/routes/tasks.ts
import { Router } from 'express';
import Level from '../models/Level';
import UserProgress from '../models/UserInLevel';
import { protect, optional } from '../middlewares/auth';
import { 
  getChallengesByLevel, 
  getChallenge, 
  submitChallengeAttempt 
} from '../controllers/taskController';

const router = Router();

/**
 * @route   GET /api/tasks/Level/:Leveld
 * @desc    Get all tasks for a Level
 * @access  Public (with optional auth for progress data)
 */
router.get('/levels/:levelId', optional, getChallengesByLevel);

/**
 * @route   GET /api/tasks/:taskId
 * @desc    Get a specific task
 * @access  Public (with optional auth for progress data)
 */
router.get('/:taskId', optional, getChallenge);

/**
 * @route   POST /api/tasks/:taskId/attempt
 * @desc    Submit a task attempt
 * @access  Private
 */
router.post('/:taskId/attempt', protect, submitChallengeAttempt);

/**
 * @route   GET /api/tasks/types/vocabulary
 * @desc    Get vocabulary tasks
 * @access  Public (with optional auth for progress data)
 */
router.get('/types/vocabulary', optional, async (req, res) => {
  try {
    // Find all levels that have vocabulary tasks
    const levels = await Level.find({
      "tasks.type": "vocabulary"
    });
    
    // Extract just the vocabulary tasks
    const vocabularyChallenges = [];
    
    for (const level of levels) {
      for (const task of level.tasks) {
        if (task.type === 'vocabulary') {
          // Basic task data
          const taskData = {
            _id: task._id,
            levelId: level._id,
            topicId: level.topicId,
            type: task.type,
            content: task.content,
            difficulty: task.difficulty,
            points: task.points,
            progress: null // Will be populated if authenticated
          };
          
          // Add progress data if authenticated
          if (req.user) {
            const userProgress = await UserProgress.findOne({ userId: req.user.userId });
            
            if (userProgress) {
              // Find topic progress
              const topicProgress = userProgress.topic.find(tp => 
                tp.topicId.toString() === level.topicId.toString()
              );
              
              if (topicProgress) {
                // Find level progress
                const levelProgress = topicProgress.levels.find(level => 
                level.levelId === level._id.toString()
                );
                
                if (levelProgress) {
                  // Find task progress
                  const taskProgress = levelProgress.tasks.find(ch => 
                    ch.taskId === task._id.toString()
                  );
                  
                  if (taskProgress) {
                    taskData.progress = {
                      completed: taskProgress.completed,
                      score: taskProgress.score,
                      attempts: taskProgress.attempts,
                      lastAttempt: taskProgress.lastAttempt
                    };
                  }
                }
              }
            }
          }
          
          vocabularyChallenges.push(taskData);
        }
      }
    }
    
    res.json({
      success: true,
      data: vocabularyChallenges
    });
  } catch (error) {
    console.error('Error fetching vocabulary tasks:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching vocabulary tasks' 
    });
  }
});

/**
 * @route   GET /api/tasks/types/writing
 * @desc    Get writing tasks
 * @access  Public (with optional auth for progress data)
 */
router.get('/types/writing', optional, async (req, res) => {
  try {
    // Find all levels that have writing tasks
    const levels = await Level.find({
      "tasks.type": "writing"
    });
    
    // Extract just the writing tasks
    const writingChallenges = [];
    
    for (const level of levels) {
      for (const task of level.tasks) {
        if (task.type === 'writing') {
          // Basic task data
          const taskData = {
            _id: task._id,
            levelId: level._id,
            topicId: level.topicId,
            type: task.type,
            content: task.content,
            difficulty: task.difficulty,
            points: task.points,
            progress: null // Will be populated if authenticated
          };
          
          // Add progress data if authenticated
          if (req.user) {
            const userProgress = await UserProgress.findOne({ userId: req.user.userId });
            
            if (userProgress) {
              // Find topic progress
              const topicProgress = userProgress.topic.find(tp => 
                tp.topicId.toString() === Level.topicId.toString()
              );
              
              if (topicProgress) {
                // Find level progress
                const levelProgress = topicProgress.levels.find(level => 
                  level.levelId === level._id.toString()
                );
                
                if (levelProgress) {
                  // Find task progress
                  const taskProgress = levelProgress.tasks.find(ch => 
                    ch.taskId === task._id.toString()
                  );
                  
                  if (taskProgress) {
                    taskData.progress = {
                      completed: taskProgress.completed,
                      score: taskProgress.score,
                      attempts: taskProgress.attempts,
                      lastAttempt: taskProgress.lastAttempt
                    };
                  }
                }
              }
            }
          }
          
          writingChallenges.push(taskData);
        }
      }
    }
    
    res.json({
      success: true,
      data: writingChallenges
    });
  } catch (error) {
    console.error('Error fetching writing tasks:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching writing tasks' 
    });
  }
});

/**
 * @route   GET /api/tasks/types/conversation
 * @desc    Get conversation tasks
 * @access  Public (with optional auth for progress data)
 */
router.get('/types/conversation', optional, async (req, res) => {
  try {
    // Find all levels that have conversation tasks
    const levels = await Level.find({
      "tasks.type": "conversation"
    });
    
    // Extract just the conversation tasks
    const conversationChallenges = [];
    
      for (const level of levels) {
      for (const task of level.tasks) {
        if (task.type === 'conversation') {
          // Basic task data
          const taskData = {
            _id: task._id,
            levelId: level._id,
            topicId: level.topicId,
            type: task.type,
            content: task.content,
            difficulty: task.difficulty,
            points: task.points,
            progress: null // Will be populated if authenticated
          };
          
          // Add progress data if authenticated
          if (req.user) {
            const userProgress = await UserProgress.findOne({ userId: req.user.userId });
            
            if (userProgress) {
              // Find topic progress
              const topicProgress = userProgress.topic.find(tp => 
                tp.topicId.toString() === Level.topicId.toString()
              );
              
              if (topicProgress) {
                // Find level progress
                const levelProgress = topicProgress.levels.find(level => 
                  level.levelId === level._id.toString()
                );
                
                if (levelProgress) {
                  // Find task progress
                  const taskProgress = levelProgress.tasks.find(ch => 
                    ch.taskId === task._id.toString()
                  );
                  
                  if (taskProgress) {
                    taskData.progress = {
                      completed: taskProgress.completed,
                      score: taskProgress.score,
                      attempts: taskProgress.attempts,
                      lastAttempt: taskProgress.lastAttempt
                    };
                  }
                }
              }
            }
          }
          
          conversationChallenges.push(taskData);
        }
      }
    }
    
    res.json({
      success: true,
      data: conversationChallenges
    });
  } catch (error) {
    console.error('Error fetching conversation tasks:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching conversation tasks' 
    });
  }
});

export default router;