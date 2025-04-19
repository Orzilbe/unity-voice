// apps/api/src/controllers/taskController.ts
import { Request, Response } from 'express';
import Topic from '../models/Topic';
import Level from '../models/Level';
import UserInLevel from '../models/UserInLevel';
import Task from '../models/Task'; 
import { TaskType } from '@unity-voice/types';
import mongoose from 'mongoose';

/**
 * @desc    Get all tasks for a Level
 * @route   GET /api/tasks/levels/:levelId
 * @access  Private
 */
export const getTasksByLevel = async (req: Request, res: Response) => {
  try {
    const { levelId } = req.params;
    
    // Validate levelId
    if (!mongoose.Types.ObjectId.isValid(levelId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid level ID format'
      });
    }
    
    const level = await Level.findById(levelId);
    
    if (!level) {
      return res.status(404).json({
        success: false,
        error: 'Level not found'
      });
    }
    
    // Find tasks associated with this level
    const tasks = await Task.find({ levelId: levelId });
    
    // Get user progress for this level if authenticated
    let userInLevelProgress: any[] = [];
    if (req.user?.userId) {
      const userInLevel = await UserInLevel.findOne({ userId: req.user.userId });
      if (userInLevel) {
        // Find topic that contains this level
        for (const topic of userInLevel.topic) {
          for (const level of topic.levels) {
            if (level.levelId === levelId) {
              userInLevelProgress = level.tasks;
              break;
            }
          }
        }
      }
    }
    
    // Add progress information to tasks
    const tasksWithProgress = tasks.map(task => {
      const progress = UserInLevelProgress.find(p => p.taskId === task._id.toString());
      return {
        ...task.toObject(),
        progress: progress ? {
          completed: progress.completed,
          score: progress.score,
          attempts: progress.attempts,
          lastAttempt: progress.lastAttempt
        } : null
      };
    });
    
    res.json({
      success: true,
      data: {
        level: {
          _id: level._id,
          topic: level.topic,
          order: level.order,
          title: level.title,
          description: level.description
        },
        tasks: tasksWithProgress
      }
    });
  } catch (error) {
    console.error('Error in getTasksByLevel:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get a specific task
 * @route   GET /api/tasks/:taskId
 * @access  Private
 */
export const getTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID'
      });
    }
    
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Get the level this task belongs to
    const level = await Level.findById(task.levelId);
    
    if (!level) {
      return res.status(404).json({
        success: false,
        error: 'Associated level not found'
      });
    }
    
    // Get user progress for this task if authenticated
    let taskProgress = null;
    if (req.user?.userId) {
      const userProgress = await UserProgress.findOne({ userId: req.user.userId });
      if (userProgress) {
        // Find topic and level that contains this task
        for (const topic of userProgress.topic) {
          for (const level of topic.levels) {
            const progress = level.tasks.find(p => p.taskId === taskId);
            if (progress) {
              taskProgress = progress;
              break;
            }
          }
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        task: {
          ...task.toObject(),
          levelId: task.levelId,
          topic: level.topic
        },
        progress: taskProgress ? {
          completed: taskProgress.completed,
          score: taskProgress.score,
          attempts: taskProgress.attempts,
          lastAttempt: taskProgress.lastAttempt
        } : null
      }
    });
  } catch (error) {
    console.error('Error in getTask:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Submit a task attempt
 * @route   POST /api/tasks/:taskId/attempt
 * @access  Private
 */
export const submitTaskAttempt = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { taskId } = req.params;
    const { answers, timeTaken } = req.body;
    
    // Find the task
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Find level and topic that this task belongs to
    const level = await Level.findById(task.levelId);
    if (!level) {
      return res.status(404).json({
        success: false,
        error: 'Associated level not found'
      });
    }
    
    // Calculate score based on task type, answers and time taken
    let score = 0;
    let completed = false;
    
    // This is simplified - would need to be implemented based on task types
    switch (task.taskType) {
      case TaskType.WORD:
        // Example: Calculate score based on correct vocabulary answers
        score = calculateVocabularyScore(task, answers);
        completed = score >= task.taskScore * 0.7; // 70% to pass
        break;
      case TaskType.QUIZ:
        // Example: Score for quiz
        score = Math.min(answers.score || 0, task.taskScore);
        completed = score >= task.taskScore * 0.7; // 70% to pass
        break;
      case TaskType.INTERACTIVE_SESSION:
        // Example: Score for interactive sessions
        score = calculateInteractiveSessionScore(task, answers, timeTaken);
        completed = score >= task.taskScore * 0.6; // 60% to pass
        break;
      default:
        score = 0;
        completed = false;
    }
    
    // Update user progress
    let userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        error: 'User progress not found'
      });
    }
    
    let levelFound = false;
    let taskFound = false;
    
    // Find the topic and level and update the task progress
    for (let i = 0; i < userProgress.topic.length; i++) {
      if (userProgress.topic[i].topicId === level.topicId.toString()) {
        for (let j = 0; j < userProgress.topic[i].levels.length; j++) {
          if (userProgress.topic[i].levels[j].levelId === level._id.toString()) {
            levelFound = true;
            
            for (let k = 0; k < userProgress.topic[i].levels[j].tasks.length; k++) {
              if (userProgress.topic[i].levels[j].tasks[k].taskId === taskId) {
                taskFound = true;
                
                // Update task progress
                const currentScore = userProgress.topic[i].levels[j].tasks[k].score;
                
                // Only update score if it's higher than current score
                if (score > currentScore) {
                  userProgress.topic[i].levels[j].tasks[k].score = score;
                }
                
                userProgress.topic[i].levels[j].tasks[k].attempts += 1;
                userProgress.topic[i].levels[j].tasks[k].lastAttempt = new Date();
                
                // Only mark as completed if not already completed
                if (!userProgress.topic[i].levels[j].tasks[k].completed) {
                  userProgress.topic[i].levels[j].tasks[k].completed = completed;
                }
                
                break;
              }
            }
            
            // If task not found, add it
            if (!taskFound) {
              userProgress.topic[i].levels[j].tasks.push({
                taskId,
                type: task.taskType,
                completed,
                score,
                attempts: 1,
                lastAttempt: new Date()
              });
            }
            
            // Update level's earned score
            userProgress.topic[i].levels[j].earnedScore = 
              userProgress.topic[i].levels[j].tasks.reduce(
                (sum, t) => sum + t.score, 0
              );
            
            // Check if level is completed
            const allTasksCompleted = userProgress.topic[i].levels[j].tasks.every(
              t => t.completed
            );
            
            if (allTasksCompleted && !userProgress.topic[i].levels[j].completed) {
              userProgress.topic[i].levels[j].completed = true;
              userProgress.topic[i].levels[j].completedAt = new Date();
            }
            
            break;
          }
        }
        
        // Update topic score
        userProgress.topic[i].earnedScore = userProgress.topic[i].levels.reduce(
          (sum, level) => sum + level.earnedScore, 0
        );
        
        break;
      }
    }
    
    // Update total points and user rank
    userProgress.lastActivityDate = new Date();
    await userProgress.updateTotalPoints();
    await userProgress.updateRank();
    
    await userProgress.save();
    
    res.json({
      success: true,
      data: {
        task: {
          id: taskId,
          type: task.taskType
        },
        attempt: {
          score,
          completed,
          totalScore: userProgress.totalPoints,
          rank: userProgress.rank
        }
      }
    });
  } catch (error) {
    console.error('Error in submitTaskAttempt:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get tasks by type
 * @route   GET /api/tasks/types/:taskType
 * @access  Public (with optional auth for progress data)
 */
export const getTasksByType = async (req: Request, res: Response) => {
  try {
    const { taskType } = req.params;
    
    // Validate task type
    if (!Object.values(TaskType).includes(taskType as TaskType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task type'
      });
    }
    
    // Find tasks of the specified type
    const tasks = await Task.find({ taskType });
    
    // Extract basic task data
    const taskData = await Promise.all(tasks.map(async (task) => {
      // Find Level this task belongs to
      const Level = await Level.findById(task.LevelId);
      
      if (!Level) {
        return null; // Skip if level not found
      }
      
      // Basic task data
      const taskInfo = {
        _id: task._id,
        levelId: task.levelId,
        topicId: level.topicId,
        type: task.taskType,
        score: task.taskScore,
        durationTask: task.durationTask,
        progress: null // Will be populated if authenticated
      };
      
      // Add progress data if authenticated
      if (req.user?.userId) {
        const userProgress = await UserInLevel.findOne({ userId: req.user.userId });
        
        if (userProgress) {
          // Find the relevant task progress
          let taskProgress = null;
          
          // Loop through topic and levels to find the task
          for (const topic of userProgress.topic) {
            if (taskProgress) break;
            
            for (const level of topic.levels) {
              if (taskProgress) break;
              
              taskProgress = level.tasks.find(t => t.taskId === task._id.toString());
            }
          }
          
          if (taskProgress) {
            taskInfo.progress = {
              completed: taskProgress.completed,
              score: taskProgress.score,
              attempts: taskProgress.attempts,
              lastAttempt: taskProgress.lastAttempt
            };
          }
        }
      }
      
      return taskInfo;
    }));
    
    // Filter out null values (from tasks with missing Levels)
    const validTaskData = taskData.filter(task => task !== null);
    
    res.json({
      success: true,
      data: validTaskData
    });
  } catch (error) {
    console.error(`Error in getTasksByType:`, error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Helper functions for score calculation
const calculateVocabularyScore = (task: any, answers: any[]): number => {
  // Example implementation
  if (!answers || !Array.isArray(answers)) {
    return 0;
  }
  
  const correctAnswers = answers.filter(answer => answer.isCorrect).length;
  const totalQuestions = answers.length;
  
  if (totalQuestions === 0) return 0;
  
  const percentage = (correctAnswers / totalQuestions) * 100;
  return Math.floor((percentage / 100) * task.taskScore);
};

const calculateInteractiveSessionScore = (task: any, answers: any, timeTaken: number): number => {
  // Example implementation
  if (!answers || typeof answers !== 'object') {
    return 0;
  }
  
  const baseScore = answers.correctPronunciation || 0;
  const fluencyScore = answers.fluency || 0;
  const grammarScore = answers.grammar || 0;
  
  // Time efficiency bonus
  let timeBonus = 0;
  if (task.durationTask && timeTaken < task.durationTask) {
    timeBonus = Math.floor((1 - timeTaken / task.durationTask) * 10);
  }
  
  // Calculate weighted score
  const totalScore = (baseScore * 0.5) + (fluencyScore * 0.25) + (grammarScore * 0.25) + timeBonus;
  
  // Scale to task points
  return Math.min(Math.floor(totalScore * task.taskScore / 100), task.taskScore);
};