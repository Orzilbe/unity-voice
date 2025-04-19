// apps/api/src/routes/vocabulary.ts
import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { Challenge } from '../models/Challenge';
import UserProgress from '../models/UserInLevel';
import { IChallengeProgress } from '../models/UserInLevel';
import { Configuration, OpenAIApi } from 'openai';

const router = Router();

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Get or create a vocabulary task
router.get('/:topicId/:levelId', protect, async (req, res) => {
  try {
    const { topicId, levelId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check for existing active task
    const userProgress = await UserProgress.findOne({ userId });
    if (userProgress) {
      const topicProgress = userProgress.topic.find(tp => tp.topicId === parseInt(topicId));
      if (topicProgress) {
        const levelProgress = topicProgress.levels.find(sp => sp.levelId === parseInt(levelId));
        if (levelProgress) {
          const activeChallenge = levelProgress.tasks.find(
            (ch: IChallengeProgress) => !ch.completed
          );
          if (activeChallenge) {
            const task = await Challenge.findById(activeChallenge.taskId);
            if (task) {
              return res.json(task);
            }
          }
        }
      }
    }

    // Get user's learned words
    const learnedWords = userProgress?.wordsLearned || [];
    const learnedWordSet = new Set(learnedWords.map(w => w.word));

    // Generate new words using OpenAI
    const prompt = `Generate 5-8 English words related to ${topicId} topic, level ${levelId}. 
    For each word, provide:
    1. The word in English
    2. Hebrew translation
    3. A usage example
    4. Difficulty level (beginner/intermediate/advanced)
    
    Format as JSON array of objects with fields: word, translation, example, difficulty`;

    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 500,
      temperature: 0.7,
    });

    const words = JSON.parse(completion.data.choices[0].text || '[]');
    
    // Filter out words the user already knows
    const newWords = words.filter((word: any) => !learnedWordSet.has(word.word));

    if (newWords.length === 0) {
      return res.status(400).json({ message: 'No new words available for this level' });
    }

    // Create new task
    const task = new Challenge({
      type: 'vocabulary',
      topicId: parseInt(topicId),
      levelId: parseInt(levelId),
      content: {
        words: newWords,
        quiz: {
          questions: newWords.map((word: any) => ({
            question: `What is the Hebrew translation of "${word.word}"?`,
            options: [
              word.translation,
              ...words.filter((w: any) => w.word !== word.word)
                .map((w: any) => w.translation)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
            ].sort(() => Math.random() - 0.5),
            correctAnswer: word.translation
          }))
        }
      }
    });

    await task.save();

    // Update user progress
    if (!userProgress) {
      const newUserProgress = new UserProgress({
        userId,
        topic: [{
          topicId: parseInt(topicId),
          levels: [{
            levelId: parseInt(levelId),
            tasks: [{
              taskId: task._id,
              completed: false,
              score: 0,
              attempts: 0
            }]
          }]
        }]
      });
      await newUserProgress.save();
    } else {
      const topicProgress = userProgress.topic.find(tp => tp.topicId === parseInt(topicId));
      if (!topicProgress) {
        userProgress.topic.push({
          topicId: parseInt(topicId),
          levels: [{
            levelId: parseInt(levelId),
            tasks: [{
              taskId: task._id,
              completed: false,
              score: 0,
              attempts: 0
            }]
          }]
        });
      } else {
        const levelProgress = topicProgress.levels.find(sp => sp.levelId === parseInt(levelId));
        if (!levelProgress) {
          topicProgress.levels.push({
            levelId: parseInt(levelId),
            tasks: [{
              taskId: task._id,
              completed: false,
              score: 0,
              attempts: 0
            }]
          });
        } else {
          levelProgress.tasks.push({
            taskId: task._id,
            completed: false,
            score: 0,
            attempts: 0
          });
        }
      }
      await userProgress.save();
    }

    res.json(task);
  } catch (error) {
    console.error('Error in vocabulary task:', error);
    res.status(500).json({ message: 'Error creating vocabulary task' });
  }
});

// Submit vocabulary task answers
router.post('/:taskId/submit', protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { answers } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const task = await Challenge.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const userProgress = await UserProgress.findOne({ userId });
    if (!userProgress) {
      return res.status(404).json({ message: 'User progress not found' });
    }

    // Find the task progress
    const topicProgress = userProgress.topic.find(tp => tp.topicId === task.topicId);
    if (!topicProgress) {
      return res.status(404).json({ message: 'Topic progress not found' });
    }

    const levelProgress = topicProgress.levels.find(sp => sp.levelId === task.levelId);
    if (!levelProgress) {
      return res.status(404).json({ message: 'Stage progress not found' });
    }

    const taskProgress = levelProgress.tasks.find(
      (ch: IChallengeProgress) => ch.taskId.toString() === taskId
    );
    if (!taskProgress) {
      return res.status(404).json({ message: 'Challenge progress not found' });
    }

    // Calculate score
    const questions = task.content.quiz.questions;
    const score = questions.reduce((total: number, question: any, index: number) => {
      return total + (answers[index] === question.correctAnswer ? 1 : 0);
    }, 0);

    // Update task progress
    taskProgress.completed = true;
    taskProgress.score = score;
    taskProgress.attempts += 1;
    taskProgress.lastAttempt = new Date();

    // Add learned words
    task.content.words.forEach((word: any) => {
      userProgress.wordsLearned.push({
        word: word.word,
        translation: word.translation,
        topicId: task.topicId,
        levelId: task.levelId,
        taskId: task._id,
        learnedAt: new Date(),
        lastReviewed: new Date(),
        masteryLevel: 1
      });
    });

    // Update total points
    await userProgress.updateTotalPoints();
    await userProgress.updateRank();

    await userProgress.save();

    res.json({
      score,
      totalQuestions: questions.length,
      correctAnswers: score,
      incorrectAnswers: questions.length - score,
      nextChallenge: {
        type: 'writing',
        topicId: task.topicId,
        levelId: task.levelId
      }
    });
  } catch (error) {
    console.error('Error submitting vocabulary task:', error);
    res.status(500).json({ message: 'Error submitting vocabulary task' });
  }
});

export default router; 