// apps/api/src/routes/flashcardRoutes.ts
import express from 'express';
import mongoose, { Document } from 'mongoose';
import Flashcard, { IFlashcard } from '../models/Flashcard';
import Topic from '../models/Topic';
import User from '../models/User';
import UserProgress, { IUserProgress } from '../models/UserProgress';
import { protect } from '../middlewares/auth';
import debug from 'debug';
import { OpenAI } from 'openai';
import UserLearnedWord from '../models/UserLearnedWord';

interface JWTPayload {
  userId: string;
  email: string;
  exp?: number;
}

interface IUserRequest extends express.Request {
  user?: JWTPayload;
}

interface ITopic extends Document {
  _id: mongoose.Types.ObjectId;
  topicName: string;
}

interface IUserProgressDoc extends Document, IUserProgress {
  learnedWords: Array<{
    flashcardId: string;
    topicId: string;
    learnedAt: Date;
  }>;
}

interface IFlashcardDoc extends Document, IFlashcard {
  _id: mongoose.Types.ObjectId;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const log = debug('app:flashcard-routes');
const router = express.Router();

async function getUserEnglishLevel(userId: string): Promise<string> {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    return user.englishLevel;
  } catch (error) {
    console.error('Error getting user English level:', error);
    return 'intermediate';
  }
}
/**
 * Generate flashcards using OpenAI based on user's English level
 */
async function generateFlashcardsWithOpenAI(topicName: string, topicId: string, userId: string) {
  try {
    // Get user's English level
    const userEnglishLevel = await getUserEnglishLevel(userId);
    
    let prompt = '';
    
    if(topicName === "Diplomacy and International Relations") {
      prompt = `Generate 7 unique words related to diplomacy and international relations, appropriate for ${userEnglishLevel} level English learners.
        highlighting:
           - Diplomatic negotiations
           - International conflict resolution
           - Geopolitical strategies
           - Cross-cultural communication
           - Israeli diplomatic tasks
 
           For each word, provide:
           1. An innovative diplomatic term
           2. Hebrew translation
           3. Detailed diplomatic context
           4. An example sentence showing its application
 
           Respond as a JSON array with these fields:
           [{
             "word": "Diplomatic term",
             "translation": "Hebrew translation",
             "example": "Contextual usage sentence highlighting diplomatic nuance"
           }, ...]
             IMPORTANT: 
             - Focus on diplomacy and international relations terms
             -Make sure your translation into Hebrew is correct, accurate, and in the appropriate context.
             - Keep examples diplomatic-oriented
             - Adjust difficulty to ${userEnglishLevel} level`;
    } else if(topicName === "Economy and Entrepreneurship") {
      prompt = `Generate 7 unique words related to economy and entrepreneurship, appropriate for ${userEnglishLevel} level English learners.
      focusing on:
          - Startup ecosystem
          - Economic innovation
          - Financial technologies
          - Entrepreneurial strategies
          - Global economic influence
      Respond as a JSON array with these fields:
      [{
        "word": "English word",
        "translation": "Hebrew translation",
        "example": "A clear, natural example sentence in English using the word"
      }, ...]

      IMPORTANT: 
      - Focus on economic and financial terms
                   -Make sure your translation into Hebrew is correct, accurate, and in the appropriate context.
      - Keep examples business-oriented
      - Adjust difficulty to ${userEnglishLevel} level`;
    } else if(topicName === "Innovation and Technology") {
      prompt = `Generate 7 unique words related to environment and sustainability, appropriate for ${userEnglishLevel} level English learners.
      focusing on:
          - Green technologies
          - Ecological innovations
          - Water conservation
          - Renewable energy
          - Sustainable urban development
      
      Respond as a JSON array with these fields:
      [{
        "word": "English word",
        "translation": "Hebrew translation",
        "example": "A clear, natural example sentence in English using the word"
      }, ...]

      IMPORTANT: 
      - Focus on environmental and sustainability terms
                   -Make sure your translation into Hebrew is correct, accurate, and in the appropriate context.

      - Keep examples environmentally-oriented
      - If you have an example that could include a true and correct Israeli invention, use it.
      - Adjust difficulty to ${userEnglishLevel} level`;
    }else if(topicName === "History and Heritage") { 
      prompt = `Generate 7 unique words related to history and historical events, appropriate for ${userEnglishLevel} level English learners.
      focusing on:
          - Historical israeli and jewish milestones
          - Cultural heritage
          - Zionist movement
          - Jewish diaspora experiences
          - Historical resiliences
          
      Respond as a JSON array with these fields:
      [{
        "word": "English word",
        "translation": "Hebrew translation",
        "example": "A clear, natural example sentence in English using the word"
      }, ...]

           IMPORTANT: 
      - Focus on historical and cultural terms
                   -Make sure your translation into Hebrew is correct, accurate, and in the appropriate context.
      - pro israeli and jewish history
      - Keep examples focusing on historical and cultural terms of Israel and Judaism - Pro-Israeli
      - Adjust difficulty to ${userEnglishLevel} level`;
    }else if(topicName === "Holocaust and Revival") {
      prompt = `Generate 7 unique words related to culture and traditions, appropriate for ${userEnglishLevel} level English learners.
      focusing on:
          - Holocaust remembrance
          - Jewish resilience
          - Post-traumatic recovery
          - Cultural preservation
          - Rebirth and hope
          
      Respond as a JSON array with these fields:
      [{
        "word": "English word",
        "translation": "Hebrew translation",
        "example": "A clear, natural example sentence in English using the word"
      }, ...]

           IMPORTANT: 
      - Focus on historical and cultural terms
     -Make sure your translation into Hebrew is correct, accurate, and in the appropriate context.
      - Keep examples focusing on historical and cultural terms of Israel and Judaism - Pro-Israeli
      - Adjust difficulty to ${userEnglishLevel} level`;
    }else if(topicName === "Innovation and Technology") {
      prompt = `Generate 7 unique words related to innovation and technology, appropriate for ${userEnglishLevel} level English learners.
      focusing on:
         - Startup ecosystem
          - Technological breakthroughs
          - AI and machine learning
          - Cybersecurity innovations
          - Green tech and sustainability
          
      Respond as a JSON array with these fields:
      [{
        "word": "English word",
        "translation": "Hebrew translation",
        "example": "A clear, natural example sentence in English using the word"
      }, ...]
           IMPORTANT: 
      - Focus on innovation and technology terms
      - Keep examples focusing on innovation and technology terms of Israel and Judaism - Pro-Israeli
      - Adjust difficulty to ${userEnglishLevel} level`;
    }else if(topicName === "Iron Swords War") {
      prompt = `Generate 7 unique words related to the Gaza war, appropriate for ${userEnglishLevel} level English learners.
      focusing on:
          - Israeli military operations
          - Palestinian resistance
          - International response
          - Humanitarian concerns
          - Geopolitical implications
          
      Respond as a JSON array with these fields:
      [{
        "word": "English word",
        "translation": "Hebrew translation",
        "example": "A clear, natural example sentence in English using the word"
      }, ...]

          IMPORTANT: 
      - Focus on historical and cultural terms
      - Make sure your translation into Hebrew is correct, accurate, and in the appropriate context.
      - Keep examples focusing on historical and cultural terms of Israel and Judaism - Pro-Israeli
      - Adjust difficulty to ${userEnglishLevel} level
      
      about gaza war:
      - The Gaza war has been fought between Israel and Hamas-led Palestinian militant groups in the Gaza Strip and Israel since 7 October 2023.
      -The first day was the deadliest in Israel's history
      `;
    }
    else if(topicName === "Society and Multiculturalism") {
      prompt = `Generate 7 unique words related to society and multiculturalism, appropriate for ${userEnglishLevel} level English learners.
      focusing on:
          - Israeli society
          - Jewish society
          - Israeli-Palestinian relations
          - Israeli-Arab relations
          - Israeli-Jewish relations

          
      Respond as a JSON array with these fields:
      [{
        "word": "English word",
        "translation": "Hebrew translation",
        "example": "A clear, natural example sentence in English using the word"
      }, ...]
      
          IMPORTANT: 
      - Focus on historical and cultural terms
      - Keep examples focusing cultural terms of Israel- Pro-Israeli
      - Make sure your translation into Hebrew is correct, accurate, and in the appropriate context.
      - Adjust difficulty to ${userEnglishLevel} level`;
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a precise language learning assistant creating vocabulary words." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const responseText = completion.choices[0].message.content?.trim() || '';
    let flashcardsData;

    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      try {
        flashcardsData = JSON.parse(jsonString);
      } catch (jsonError) {
        console.error('[DEBUG] Error parsing OpenAI response as JSON:', jsonError);
        const wordEntries = responseText.split(/\d+\.\s+/).filter(entry => entry.trim().length > 0);
        flashcardsData = wordEntries.map(entry => {
          const parts = entry.split(':');
          if (parts.length >= 2) {
            const word = parts[0].trim();
            const rest = parts.slice(1).join(':').trim();
            const sentences = rest.split(/\.\s+/);
            const translation = sentences[0].trim();
            const example = sentences.length > 1 ? sentences.slice(1).join('. ').trim() : '';
            return { word, translation, example };
          }
          return null;
        }).filter(item => item !== null);
      }
    } catch (error) {
      console.error('[DEBUG] Error processing OpenAI response:', error);
      console.log('[DEBUG] Raw response:', responseText);
      return [];
    }

    const flashcards = [];
    for (let i = 0; i < flashcardsData.length; i++) {
      const { word, translation, example = "" } = flashcardsData[i];

      const flashcard = new Flashcard({
        word,
        translation,
        topicId,
        example: example,
        examples: [],
        difficulty: 'intermediate'
      });

      await flashcard.save();
      flashcards.push(flashcard);
    }

    return flashcards;
  } catch (error) {
    console.error('[DEBUG] Error generating flashcards with OpenAI:', error);
    return [];
  }
}

router.post('/', async (req, res) => {
  console.log('⭐ CREATE FLASHCARD ROUTE HIT ⭐');
  console.log('Body:', req.body);
  try {
    const { word, translation, topicName, level = 1, example = [] } = req.body;
    if (!word || !translation || !topicName) {
      return res.status(400).json({ success: false, error: 'Word, translation, and topic are required' });
    }
    const topicDoc = await Topic.findOne({ topicName: String(topicName) });
    if (!topicDoc) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    const flashcard = new Flashcard({
      word,
      translation,
      topicId: topicDoc._id,
      level: Number(level),
      example,
      difficulty: 'intermediate'
    });

    await flashcard.save();
    console.log(`Created flashcard: ${word}`);
    return res.json({ success: true, data: flashcard });
  } catch (error) {
    console.error('Error creating flashcard:', error);
    return res.status(500).json({ success: false, error: 'Failed to create flashcard' });
  }
});

router.get('/:topic/:level', protect, async (req: IUserRequest, res) => {
  try {
    const { topic, level } = req.params;
    const userId = req.user?.userId;
    const topicDoc = await Topic.findOne({ topicName: String(topic) }) as ITopic | null;

    if (!topicDoc) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    let flashcards = await Flashcard.find({ topicId: topicDoc._id, level: Number(level) || 1 });

    if (userId) {
      const learnedWords = await UserLearnedWord.find({ userId, topicId: topicDoc._id.toString() });
      const learnedFlashcardIds = learnedWords.map(word => word.flashcardId);
      flashcards = flashcards.filter((card: any) => !learnedFlashcardIds.includes(card._id.toString()));
    }

    if (flashcards.length < 5 && userId) {
      const newFlashcards = await generateFlashcardsWithOpenAI(String(topic), topicDoc._id.toString(), userId);
      flashcards = [...flashcards, ...newFlashcards];
    }

    return res.json({ success: true, data: flashcards });
  } catch (error) {
    console.error('[DEBUG] Error fetching flashcards:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch flashcards' });
  }
});

router.post('/mark-learned', protect, async (req: IUserRequest, res) => {
  try {
    const { flashcardId, topicId, word } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    if (!word) {
      return res.status(400).json({ 
        success: false, 
        message: 'Word is required' 
      });
    }

    // Check if the word is already marked as learned
    const existingLearnedWord = await UserLearnedWord.findOne({ 
      userId,
      flashcardId
    });

    if (existingLearnedWord) {
      return res.json({ 
        success: true, 
        message: 'Word already marked as learned' 
      });
    }

    // Create new learned word - use flashcardId but also set wordId for compatibility
    const newLearnedWord = new UserLearnedWord({
      userId,
      flashcardId, // Primary ID field
      wordId: flashcardId, // Set wordId to flashcardId for backward compatibility with existing DB index
      topicId,
      word,
      learnedAt: new Date()
    });
    
    await newLearnedWord.save();

    // Update user progress
    let userProgress = await UserProgress.findOne({ userId });
    if (userProgress) {
      // Initialize wordsLearned array if it doesn't exist
      if (!userProgress.wordsLearned) {
        userProgress.wordsLearned = [];
      }
      
      // Add the word to the wordsLearned array
      userProgress.wordsLearned.push({
        word,
        topicId,
        learnedAt: new Date()
      });
      
      // Update last activity date
      userProgress.lastActivityDate = new Date();
      
      await userProgress.save();
    }

    return res.json({ 
      success: true, 
      message: 'Word marked as learned', 
      data: newLearnedWord 
    });
  } catch (error) {
    console.error('Error marking word as learned:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to mark word as learned' 
    });
  }
});

export default router;