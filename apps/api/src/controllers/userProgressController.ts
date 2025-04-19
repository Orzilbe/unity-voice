// apps/api/src/controllers/userProgressController.ts
import { Request, Response } from 'express';
import UserProgress, { IUserProgress, ITopicProgress, ILevelProgress, IChallengeProgress } from '../models/UserInLevel';
import { Challenge, Stage } from '@unity-voice/types';

export const getUserProgress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const progress = await UserProgress.findOne({ userId });
    
    if (!progress) {
      return res.status(404).json({ 
        success: false,
        error: 'User progress not found' 
      });
    }
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

export const updateUserProgress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updateData: Partial<IUserProgress> = req.body;
    
    // Ensure we're not overriding critical fields with undefined values
    const safeUpdateData = { ...updateData };
    delete safeUpdateData.userId; // Don't allow changing userId
    delete safeUpdateData.topic; // Handle topic separately to avoid overwrites
    
    const progress = await UserProgress.findOneAndUpdate(
      { userId },
      { 
        ...safeUpdateData, 
        lastActivityDate: new Date() 
      },
      { new: true, upsert: true }
    );
    
    // Update total points and rank if needed
    await progress.updateTotalPoints();
    await progress.updateRank();
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

export const updateLevelProgress = async (req: Request, res: Response) => {
  try {
    const { userId, levelId, topicId } = req.params;
    const levelData = req.body;
    
    if (!topicId) {
      return res.status(400).json({ 
        success: false,
        error: 'Topic ID is required' 
      });
    }
    
    const progress = await UserProgress.findOne({ userId });
    if (!progress) {
      return res.status(404).json({ 
        success: false,
        error: 'User progress not found' 
      });
    }
    
    // Find topic
    const topicIndex = progress.topic.findIndex(t => t.topicId === topicId);
    
    if (topicIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Topic not found in user progress' 
      });
    }
    
    // Find level/level with the levelId
    const levelIndex = progress.topic[topicIndex].levels.findIndex(l => l.levelId === levelId);
    
    // Prepare level data with required fields
    const newLevelData: ILevelProgress = {
      level: levelData.level || 1,
      topicId,
      levelId,
      completed: levelData.isCompleted || false,
      completedAt: levelData.completedAt,
      tasks: [],
      earnedScore: levelData.currentScore || 0,
      createdAt: new Date()
    };

    if (levelIndex === -1) {
      // Add new level
      progress.topic[topicIndex].levels.push(newLevelData);
    } else {
      // Update existing level - preserve tasks
      const existingChallenges = progress.topic[topicIndex].levels[levelIndex].tasks;
      progress.topic[topicIndex].levels[levelIndex] = {
        ...newLevelData,
        tasks: existingChallenges
      };
    }
    
    // Update topic's earned score
    progress.topic[topicIndex].earnedScore = progress.topic[topicIndex].levels.reduce(
      (sum, level) => sum + level.earnedScore, 0
    );
    
    // Update total points and rank
    await progress.updateTotalPoints();
    await progress.updateRank();
    
    await progress.save();
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error updating level progress:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

export const updateChallengeProgress = async (req: Request, res: Response) => {
  try {
    const { userId, levelId, taskId, topicId } = req.params;
    const taskData = req.body;
    
    if (!topicId || !levelId) {
      return res.status(400).json({ 
        success: false,
        error: 'Topic ID and Stage ID are required' 
      });
    }
    
    const progress = await UserProgress.findOne({ userId });
    if (!progress) {
      return res.status(404).json({ 
        success: false,
        error: 'User progress not found' 
      });
    }
    
    // Find topic
    const topicIndex = progress.topic.findIndex(t => t.topicId === topicId);
    
    if (topicIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Topic not found in user progress' 
      });
    }
    
    // Find level/level
    const levelIndex = progress.topic[topicIndex].levels.findIndex(l => l.levelId === levelId);
    
    if (levelIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Level not found in user progress' 
      });
    }
    
    // Prepare task data with required fields
    const newChallengeData: IChallengeProgress = {
      taskId,
      type: taskData.type || 'vocabulary',
      completed: taskData.completed || false,
      score: taskData.score || 0,
      attempts: taskData.attempts || 1,
      lastAttempt: new Date()
    };
    
    // Find task
    const taskIndex = progress.topic[topicIndex].levels[levelIndex].tasks.findIndex(
      c => c.taskId === taskId
    );
    
    if (taskIndex === -1) {
      // Add new task
      progress.topic[topicIndex].levels[levelIndex].tasks.push(newChallengeData);
    } else {
      // Update existing task - increment attempts and maybe update score
      const currentChallenge = progress.topic[topicIndex].levels[levelIndex].tasks[taskIndex];
      
      progress.topic[topicIndex].levels[levelIndex].tasks[taskIndex] = {
        ...currentChallenge,
        attempts: currentChallenge.attempts + 1,
        lastAttempt: new Date(),
        completed: taskData.completed || currentChallenge.completed,
        // Only update score if new score is higher
        score: Math.max(taskData.score || 0, currentChallenge.score || 0)
      };
    }
    
    // Update level's earned score
    progress.topic[topicIndex].levels[levelIndex].earnedScore = 
      progress.topic[topicIndex].levels[levelIndex].tasks.reduce(
        (sum, ch) => sum + ch.score, 0
      );
    
    // Update topic's earned score
    progress.topic[topicIndex].earnedScore = progress.topic[topicIndex].levels.reduce(
      (sum, level) => sum + level.earnedScore, 0
    );
    
    // Check if level is completed
    const allChallengesCompleted = progress.topic[topicIndex].levels[levelIndex].tasks.every(
      ch => ch.completed
    );
    
    if (allChallengesCompleted && !progress.topic[topicIndex].levels[levelIndex].completed) {
      progress.topic[topicIndex].levels[levelIndex].completed = true;
      progress.topic[topicIndex].levels[levelIndex].completedAt = new Date();
    }
    
    // Update total points and rank
    await progress.updateTotalPoints();
    await progress.updateRank();
    
    await progress.save();
    
    res.json({
      success: true,
      data: {
        updatedChallenge: progress.topic[topicIndex].levels[levelIndex].tasks.find(
          c => c.taskId === taskId
        ),
        levelProgress: {
          levelId,
          completed: progress.topic[topicIndex].levels[levelIndex].completed,
          earnedScore: progress.topic[topicIndex].levels[levelIndex].earnedScore
        },
        topicProgress: {
          topicId,
          earnedScore: progress.topic[topicIndex].earnedScore
        },
        totalPoints: progress.totalPoints,
        rank: progress.rank
      }
    });
  } catch (error) {
    console.error('Error updating task progress:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

export const getTopicProgress = async (req: Request, res: Response) => {
  try {
    const { userId, topicId } = req.params;
    
    const progress = await UserProgress.findOne({ userId });
    if (!progress) {
      return res.status(404).json({ 
        success: false,
        error: 'User progress not found' 
      });
    }
    
    const topicProgress = progress.topic.find(t => t.topicId === topicId);
    
    if (!topicProgress) {
      return res.status(404).json({ 
        success: false,
        error: 'Topic progress not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        topicId: topicProgress.topicId,
        topicName: topicProgress.topicName,
        completed: topicProgress.completed,
        completedAt: topicProgress.completedAt,
        earnedScore: topicProgress.earnedScore,
        currentLevel: topicProgress.currentLevel,
        levels: topicProgress.levels.map(level => ({
          level: level.level,
          levelId: level.levelId,
          completed: level.completed,
          earnedScore: level.earnedScore,
          completedAt: level.completedAt,
          tasksCompleted: level.tasks.filter(c => c.completed).length,
          totalChallenges: level.tasks.length
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching topic progress:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

export const initializeUserProgress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    let userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      // Get user information for email and englishLevel
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }
      
      userProgress = await UserProgress.create({
        userId,
        userEmail: user.email,
        englishLevel: user.englishLevel,
        topic: [],
        totalPoints: 0,
        rank: 'beginner',
        lastActivityDate: new Date()
      });
    }
    
    // Initialize topic
    await userProgress.initializeTopicProgress();
    
    res.json({
      success: true,
      data: {
        userId: userProgress.userId,
        totalTopics: userProgress.topic.length,
        englishLevel: userProgress.englishLevel,
        rank: userProgress.rank
      }
    });
  } catch (error) {
    console.error('Error initializing user progress:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};