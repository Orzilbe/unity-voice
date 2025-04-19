// apps/api/src/services/writingService.ts
import { Challenge } from '../models/Challenge';
import UserProgress from '../models/UserInLevel';
import { IChallengeProgress } from '../models/UserInLevel';
import OpenAI from 'openai';
import { Types } from 'mongoose';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class WritingService {
  static async getOrCreateChallenge(userId: string, topicId: number, levelId: number) {
    const userProgress = await UserProgress.findOne({ userId: new Types.ObjectId(userId) });
    if (!userProgress) throw new Error('User progress not found');

    const topicProgress = userProgress.topic.find(tp => tp.topicId === topicId);
    if (!topicProgress) throw new Error('Topic progress not found');

    const levelProgress = topicProgress.levels.find(sp => sp.levelId === levelId);
    if (!levelProgress) throw new Error('Stage progress not found');

    // Check if vocabulary task is completed
    const vocabularyChallenge = levelProgress.tasks.find(
      (ch: IChallengeProgress) => ch.type === 'vocabulary' && ch.completed
    );
    if (!vocabularyChallenge) throw new Error('Complete vocabulary task first');

    // Check for existing active writing task
    const activeWritingChallenge = levelProgress.tasks.find(
      (ch: IChallengeProgress) => ch.type === 'writing' && !ch.completed
    );
    if (activeWritingChallenge) {
      const task = await Challenge.findById(activeWritingChallenge.taskId);
      if (task) return task;
    }

    // Get recently learned words
    const vocabularyChallengeDoc = await Challenge.findById(vocabularyChallenge.taskId);
    if (!vocabularyChallengeDoc) throw new Error('Vocabulary task not found');

    const learnedWords = (vocabularyChallengeDoc.content as any).words;

    // Generate writing prompt
    const { article, prompt: writingPrompt } = await this.generateWritingPrompt(
      topicId,
      userProgress.englishLevel,
      learnedWords
    );

    // Create new task
    const task = new Challenge({
      type: 'writing',
      topicId,
      levelId,
      content: {
        article,
        prompt: writingPrompt,
        requiredWords: learnedWords.map((w: any) => w.word),
        wordCount: {
          min: 100,
          max: 150
        }
      }
    });

    await task.save();

    // Update user progress
    levelProgress.tasks.push({
      taskId: task._id as Types.ObjectId,
      type: 'writing',
      completed: false,
      score: 0,
      attempts: 0
    });

    await userProgress.save();

    return task;
  }

  static async submitResponse(userId: string, taskId: string, response: string) {
    const task = await Challenge.findById(taskId);
    if (!task) throw new Error('Challenge not found');

    const userProgress = await UserProgress.findOne({ userId: new Types.ObjectId(userId) });
    if (!userProgress) throw new Error('User progress not found');

    // Find the task progress
    const topicProgress = userProgress.topic.find(tp => tp.topicId === task.topicId);
    if (!topicProgress) throw new Error('Topic progress not found');

    const levelProgress = topicProgress.levels.find(sp => sp.levelId === task.levelId);
    if (!levelProgress) throw new Error('Stage progress not found');

    const taskProgress = levelProgress.tasks.find(
      (ch: IChallengeProgress) => ch.taskId.toString() === taskId
    );
    if (!taskProgress) throw new Error('Challenge progress not found');

    // Analyze response
    const { score, feedback, usedWords } = await this.analyzeResponse(
      response,
      (task.content as any).requiredWords
    );

    // Update progress
    taskProgress.completed = true;
    taskProgress.score = score;
    taskProgress.attempts += 1;
    taskProgress.lastAttempt = new Date();
    taskProgress.response = response;
    taskProgress.feedback = feedback;

    // Award points
    const points = Math.floor(score * 10);
    userProgress.totalPoints += points;
    await userProgress.updateRank();
    await userProgress.save();

    return {
      score,
      feedback,
      usedWords,
      pointsAwarded: points,
      nextChallenge: score >= 3 ? {
        type: 'conversation',
        topicId: task.topicId,
        levelId: task.levelId
      } : null
    };
  }

  private static async generateWritingPrompt(
    topicId: number,
    englishLevel: string,
    learnedWords: any[]
  ) {
    const prompt = `Create a short article (200-300 words) about ${topicId} that:
    1. Is appropriate for ${englishLevel} level English learners
    2. Naturally incorporates these words: ${learnedWords.map((w: any) => w.word).join(', ')}
    3. Includes a writing prompt asking the user to:
       - Share their thoughts on the topic
       - Use at least 3 of the provided words
       - Write 100-150 words
    
    Format as JSON with fields: article, prompt`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  }

  private static async analyzeResponse(response: string, requiredWords: string[]) {
    const prompt = `Analyze this English writing response:
    Response: ${response}
    Required words: ${requiredWords.join(', ')}
    
    Provide feedback on:
    1. Use of required vocabulary words (0-2 points)
    2. Grammar and spelling (0-1 points)
    3. Content relevance and coherence (0-2 points)
    
    Format as JSON with fields: score, feedback, usedWords`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  }
} 