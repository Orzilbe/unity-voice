// apps/api/src/routes/taskRoutes.ts
import { Router } from 'express';
import { protect } from '../middlewares/auth';
import Task from '../models/Task';
import Word from '../models/Word';
import WordInTask from '../models/WordInTask';
import { createNextLevelTask } from '../services/userInitialization';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get words for a specific task
router.get('/task-words/:taskId', protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required'
      });
    }
    
    // Find the task
    const task = await Task.findOne({ taskId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Find word associations for this task
    const wordAssociations = await WordInTask.find({ taskId });
    
    if (!wordAssociations || wordAssociations.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get word IDs
    const wordIds = wordAssociations.map(wa => wa.wordId);
    
    // Find words
    const words = await Word.find({ wordId: { $in: wordIds } });
    
    // Combine word data with completion status
    const wordsWithStatus = words.map((word: any) => {
      const association = wordAssociations.find(wa => wa.wordId === word.wordId);
      return {
        ...word.toObject(),
        isCompleted: association?.isCompleted || false,
        score: association?.score || 0,
        attempts: association?.attempts || 0
      };
    });
    
    return res.json({
      success: true,
      data: wordsWithStatus
    });
  } catch (error) {
    console.error('Error fetching task words:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch task words'
    });
  }
});

// Get tasks for a user by topic
router.get('/user-topic-tasks', protect, async (req, res) => {
  try {
    const { userId, topic } = req.query;
    
    if (!userId || !topic) {
      return res.status(400).json({
        success: false,
        error: 'User ID and topic are required'
      });
    }
    
    // Find tasks for this user and topic
    const tasks = await Task.find({ 
      userId: String(userId),
      topic: String(topic)
    }).sort({ level: 1 }); // Sort by level
    
    if (!tasks || tasks.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get completion status for each task
    const tasksWithStatus = await Promise.all(tasks.map(async task => {
      const wordAssociations = await WordInTask.find({ taskId: task.taskId });
      const completedWords = wordAssociations.filter(wa => wa.isCompleted).length;
      const totalWords = wordAssociations.length;
      
      return {
        ...task.toObject(),
        progress: totalWords > 0 ? (completedWords / totalWords) * 100 : 0
      };
    }));
    
    return res.json({
      success: true,
      data: tasksWithStatus
    });
  } catch (error) {
    console.error('Error fetching user topic tasks:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user topic tasks'
    });
  }
});

// Mark a word as completed in a task
router.post('/complete-word', protect, async (req, res) => {
  try {
    const { taskId, wordId, score } = req.body;
    
    if (!taskId || !wordId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID and Word ID are required'
      });
    }
    
    // Find the word in task
    const wordInTask = await WordInTask.findOne({ taskId, wordId });
    
    if (!wordInTask) {
      return res.status(404).json({
        success: false,
        error: 'Word not found in task'
      });
    }
    
    // Update word completion status
    wordInTask.isCompleted = true;
    wordInTask.score = score || 100;
    wordInTask.attempts += 1;
    
    await wordInTask.save();
    
    // Check if all words in task are completed
    const allWordsInTask = await WordInTask.find({ taskId });
    const allCompleted = allWordsInTask.every(w => w.isCompleted);
    
    if (allCompleted) {
      // Update task completion
      const task = await Task.findOne({ taskId });
      if (task) {
        task.completionDate = new Date();
        task.taskScore = allWordsInTask.reduce((avg, w) => avg + w.score, 0) / allWordsInTask.length;
        await task.save();
        
        // Create next level task if this was level 1
        if (task.level === 1) {
          const nextTask = await createNextLevelTask(task.userId, taskId);
          return res.json({
            success: true,
            data: {
              completedTask: task,
              nextTask
            }
          });
        }
      }
    }
    
    return res.json({
      success: true,
      data: wordInTask
    });
  } catch (error) {
    console.error('Error completing word:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete word'
    });
  }
});

export default router; 