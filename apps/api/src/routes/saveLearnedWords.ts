// apps/api/src/routes/saveLearnedWords.ts
import { Request, Response } from 'express';
import { protect } from '../middlewares/auth';
import Task from '../models/Task';
import WordInTask from '../models/WordInTask';
import { TaskType } from '../models/Task';
import { v4 as uuidv4 } from 'uuid';

/**
 * @route   POST /api/save-learned-words
 * @desc    Save words that the user has learned in a flashcard session
 * @access  Private
 */
export const saveLearnedWordsHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { topic, level, learnedWords, duration } = req.body;

    if (!topic || !level || !learnedWords || !Array.isArray(learnedWords)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Create a new task record
    const taskId = uuidv4();
    const newTask = new Task({
      taskId,
      taskType: TaskType.FLASHCARD,
      userId: req.user.userId,
      level,
      topic,
      durationTask: duration || 0,
      taskScore: learnedWords.length * 10 // 10 points per word learned
    });

    await newTask.save();

    // Save each learned word
    const wordPromises = learnedWords.map(async (word) => {
      const wordInTask = new WordInTask({
        wordId: `${word.id || uuidv4()}`,
        taskId,
        word: word.word,
        translation: word.translation,
        example: word.example,
        difficulty: word.difficulty,
        topic
      });

      return wordInTask.save();
    });

    await Promise.all(wordPromises);

    return res.status(200).json({
      success: true,
      data: {
        taskId,
        wordsCount: learnedWords.length,
        pointsEarned: learnedWords.length * 10
      }
    });
  } catch (error) {
    console.error('Error saving learned words:', error);
    return res.status(500).json({
      success: false,
      error: 'Error saving learned words'
    });
  }
};

export default saveLearnedWordsHandler;