// apps/api/src/routes/postRoutes.ts
import OpenAI from "openai";
import express from 'express';
import mongoose, { Document } from 'mongoose';
import Topic from '../models/Topic';
import User from '../models/User';
import UserProgress, { IUserProgress } from '../models/UserProgress';
import UserLearnedWord from '../models/UserLearnedWord';
import { protect } from '../middlewares/auth';

interface IUserProgressDoc extends Document, IUserProgress {
  learnedWords: Array<{
    wordId: string;
    topicId: string;
    learnedAt: Date;
  }>;
}

const router = express.Router();

// Helper functions
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

async function getUserAgeRange(userId: string): Promise<string> {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    return user.ageRange;
  } catch (error) {
    console.error('Error getting user age range:', error);
    return '18-24';
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generatePostWithOpenAI(topicName: string, topicId: string, userId: string) {
  try {
    const userEnglishLevel = await getUserEnglishLevel(userId);
    const userAgeRange = await getUserAgeRange(userId);
    const learnedWords = await UserLearnedWord.find({
      userId,
      topicId: topicId
    }).sort({ learnedAt: -1 }).limit(10);
    
    let prompt = '';
    if(topicName === "Diplomacy and International Relations") {
      prompt = `
      Write a fact-based, pro-Israeli social media post in English, based on the following topic: Diplomacy and International Relations
      Audience: English learners aged ${userAgeRange} with ${userEnglishLevel} level.
      use some of the following words: ${learnedWords.map(word => word.word).join(', ')}
  Content guidelines:
  - The tone should be respectful, informative, and inspiring.
  - Use language appropriate for ${userEnglishLevel} learners.
  - Focus on positive Israeli achievements, historical facts, or cultural contributions related to the topic.
  - Avoid complex idioms or overly academic phrasing.
  - Limit the post to 100–150 words.
  - Make it sound like a real social media post (Twitter/Instagram/Facebook style).
  - End with a question or call to action to invite engagement.
  IMPORTANT: 
   - The post must be clearly pro-Israel, based on real, verifiable facts.
   - use no more the 3 emojis
   - Adjust difficulty to ${userEnglishLevel} level`;
    } 
    else if(topicName === "Economy and Entrepreneurship") {
      prompt = `
      Write a fact-based, pro-Israeli social media post in English, based on the following topic: Economy and Entrepreneurship
      Audience: English learners aged ${userAgeRange} with ${userEnglishLevel} level.
      use some of the following words: ${learnedWords.map(word => word.word).join(', ')}
      Content guidelines:
      - The tone should be respectful, informative, and inspiring.
      - Use language appropriate for ${userEnglishLevel} learners.
      - Focus on positive Israeli achievements, historical facts, or cultural contributions related to the topic.
      - Avoid complex idioms or overly academic phrasing.
      - Limit the post to 100–150 words.
      - Make it sound like a real social media post (Twitter/Instagram/Facebook style).
      - End with a question or call to action to invite engagement.
     IMPORTANT: 
      - The post must be clearly pro-Israel, based on real, verifiable facts.
      - use no more the 3 emojis
      - Adjust difficulty to ${userEnglishLevel} level`;
    } 
    else if(topicName === "Innovation and Technology") {
      prompt = `
      Write a fact-based, pro-Israeli social media post in English, based on the following topic: Innovation and Technology
      Audience: English learners aged ${userAgeRange} with ${userEnglishLevel} level.
      use some of the following words: ${learnedWords.map(word => word.word).join(', ')}
      Content guidelines:
      - The tone should be respectful, informative, and inspiring.
      - Use language appropriate for ${userEnglishLevel} learners.
      - Focus on positive Israeli achievements, historical facts, or cultural contributions related to the topic.
      - Avoid complex idioms or overly academic phrasing.
      - Limit the post to 100–150 words.
      - Make it sound like a real social media post (Twitter/Instagram/Facebook style).
      - End with a question or call to action to invite engagement.
     IMPORTANT: 
      - The post must be clearly pro-Israel, based on real, verifiable facts.
      - use no more the 3 emojis
      - Adjust difficulty to ${userEnglishLevel} level`;
    }
    else if(topicName === "History and Heritage") { 
      prompt = `
      Write a fact-based, pro-Israeli social media post in English, based on the following topic: History and Heritage
      Audience: English learners aged ${userAgeRange} with ${userEnglishLevel} level.
      use some of the following words: ${learnedWords.map(word => word.word).join(', ')}
      Content guidelines:
      - The tone should be respectful, informative, and inspiring.
      - Use language appropriate for ${userEnglishLevel} learners.
      - Focus on positive Israeli achievements, historical facts, or cultural contributions related to the topic.
      - Avoid complex idioms or overly academic phrasing.
      - Limit the post to 100–150 words.
      - Make it sound like a real social media post (Twitter/Instagram/Facebook style).
      - End with a question or call to action to invite engagement.
     IMPORTANT: 
      - The post must be clearly pro-Israel, based on real, verifiable facts.
      - use no more the 3 emojis
      - Adjust difficulty to ${userEnglishLevel} level`;
    }
    else if(topicName === "Holocaust and Revival") {
      prompt = `
      Write a fact-based, pro-Israeli social media post in English, based on the following topic: Holocaust and Revival
      Audience: English learners aged ${userAgeRange} with ${userEnglishLevel} level.
      use some of the following words: ${learnedWords.map(word => word.word).join(', ')}
      Content guidelines:
      - The tone should be respectful, informative, and inspiring.
      - Use language appropriate for ${userEnglishLevel} learners.
      - Focus on positive Israeli achievements, historical facts, or cultural contributions related to the topic.
      - Avoid complex idioms or overly academic phrasing.
      - Limit the post to 100–150 words.
      - Make it sound like a real social media post (Twitter/Instagram/Facebook style).
      - End with a question or call to action to invite engagement.
     IMPORTANT: 
      - The post must be clearly pro-Israel, based on real, verifiable facts.
      - use no more the 3 emojis
      - Adjust difficulty to ${userEnglishLevel} level`;
    }
    else if(topicName === "Iron Swords War") {
      prompt = `
      Write a fact-based, pro-Israeli social media post in English, based on the following topic: Iron Swords War
      Audience: English learners aged ${userAgeRange} with ${userEnglishLevel} level.
      use some of the following words: ${learnedWords.map(word => word.word).join(', ')}
      Content guidelines:
      - The tone should be respectful, informative, and inspiring.
      - Use language appropriate for ${userEnglishLevel} learners.
      - Focus on positive Israeli achievements, historical facts, or cultural contributions related to the topic.
      - Avoid complex idioms or overly academic phrasing.
      - Limit the post to 100–150 words.
      - Make it sound like a real social media post (Twitter/Instagram/Facebook style).
      - End with a question or call to action to invite engagement.
     IMPORTANT: 
      - The post must be clearly pro-Israel, based on real, verifiable facts.
      - use no more the 3 emojis
      - Adjust difficulty to ${userEnglishLevel} level      
      about gaza war:
      - The Gaza war has been fought between Israel and Hamas-led Palestinian militant groups in the Gaza Strip and Israel since 7 October 2023.
      -The first day was the deadliest in Israel's history
      `;
    }
    else if(topicName === "Society and Multiculturalism") {
      prompt = `
      Write a fact-based, pro-Israeli social media post in English, based on the following topic: Society and Multiculturalism
      Audience: English learners aged ${userAgeRange} with ${userEnglishLevel} level.
      use some of the following words: ${learnedWords.map(word => word.word).join(', ')}
      Content guidelines:
      - The tone should be respectful, informative, and inspiring.
      - Use language appropriate for ${userEnglishLevel} learners.
      - Focus on positive Israeli achievements, historical facts, or cultural contributions related to the topic.
      - Avoid complex idioms or overly academic phrasing.
      - Limit the post to 100–150 words.
      - Make it sound like a real social media post (Twitter/Instagram/Facebook style).
      - End with a question or call to action to invite engagement.
     IMPORTANT: 
      - The post must be clearly pro-Israel, based on real, verifiable facts.
      - use no more the 3 emojis
      - Adjust difficulty to ${userEnglishLevel} level`;
    }
    else {
      // Default prompt for any other topic
      prompt = `
      Write a fact-based, pro-Israeli social media post in English, based on the following topic: ${topicName}
      Audience: English learners aged ${userAgeRange} with ${userEnglishLevel} level.
      use some of the following words: ${learnedWords.map(word => word.word).join(', ')}
      Content guidelines:
      - The tone should be respectful, informative, and inspiring.
      - Use language appropriate for ${userEnglishLevel} learners.
      - Focus on positive Israeli achievements, historical facts, or cultural contributions related to the topic.
      - Avoid complex idioms or overly academic phrasing.
      - Limit the post to 100–150 words.
      - Make it sound like a real social media post (Twitter/Instagram/Facebook style).
      - End with a question or call to action to invite engagement.
     IMPORTANT: 
      - The post must be clearly pro-Israel, based on real, verifiable facts.
      - use no more the 3 emojis
      - Adjust difficulty to ${userEnglishLevel} level`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a precise language learning assistant creating social media posts." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0].message.content?.trim() || '';
  } catch (error) {
    console.error("Error generating post with OpenAI:", error);
    return '';
  }
}

// Get words for post about a topic
router.get('/words/:topicName', protect, async (req, res) => {
  try {
    const { topicName } = req.params;
    const userId = req.user?.userId;

    // Find the topic ID
    const topic = await Topic.findOne({ topicName }) as { _id: mongoose.Types.ObjectId };
    if (!topic) {
      return res.status(404).json({ 
        success: false, 
        error: "Topic not found",
        words: [] 
      });
    }
    
    // Get user's English level
    const user = await User.findById(userId);
    const englishLevel = user ? user.englishLevel : 'intermediate';
    
    // Get learned words for this topic
    const learnedWords = await UserLearnedWord.find({
      userId,
      topicId: topic._id
    }).sort({ learnedAt: -1 }).limit(10);
    
    if (learnedWords.length > 0) {
      return res.json({
        success: true,
        words: learnedWords.map(word => word.word),
        englishLevel
      });
    }
    
    // Provide some fallback words based on the topic
    const topicDefaultWords: Record<string, string[]> = {
      'Diplomacy and International Relations': ['diplomacy', 'ambassador', 'treaty', 'negotiation', 'alliance'],
      'Economy and Entrepreneurship': ['startup', 'innovation', 'economy', 'venture', 'growth'],
      'Innovation and Technology': ['innovation', 'tech', 'startup', 'research', 'development'],
      'History and Heritage': ['heritage', 'culture', 'tradition', 'history', 'ancient'],
      'Holocaust and Revival': ['memorial', 'survival', 'remembrance', 'resilience', 'revival'],
      'Iron Swords War': ['defense', 'security', 'protection', 'operation', 'mission'],
      'Society and Multiculturalism': ['diversity', 'culture', 'community', 'integration', 'society']
    };
    
    const defaultWords = topicDefaultWords[topicName] || 
      ['Israel', 'innovation', 'culture', 'history', 'development'];
    
    return res.json({
      success: true,
      words: defaultWords,
      englishLevel
    });
    
  } catch (error) {
    console.error("Error getting words for post:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get words",
      words: []
    });
  }
});

// Create post for a topic
router.post('/create/:topicName', protect, async (req, res) => {
  try {
    const { topicName } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    // Find the topic ID
    const topic = await Topic.findOne({ topicName }) as { _id: mongoose.Types.ObjectId };
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }
    
    // Fetch user's learned words
    let requiredWords: string[] = [];
    try {
      const learnedWords = await UserLearnedWord.find({
        userId,
        topicId: topic._id
      }).sort({ learnedAt: -1 }).limit(10);
      
      if (learnedWords && learnedWords.length > 0) {
        requiredWords = learnedWords.map(word => word.word);
      }
    } catch (error) {
      console.error('Error fetching learned words:', error);
    }
    
    // If no learned words, get default words for this topic
    if (requiredWords.length === 0) {
      // Use the words API to get default words
      try {
        const wordsResponse = await fetch(`${process.env.API_URL}/api/post/words/${encodeURIComponent(topicName)}`, {
          headers: {
            'Authorization': req.headers.authorization || ''
          }
        });
        
        if (wordsResponse.ok) {
          const data = await wordsResponse.json();
          if (data.success && data.words) {
            requiredWords = data.words;
          }
        }
      } catch (apiError) {
        console.error('Error fetching words from API:', apiError);
        
        // Fallback words if API call fails
        const topicDefaultWords: Record<string, string[]> = {
          'Diplomacy and International Relations': ['diplomacy', 'ambassador', 'treaty', 'negotiation', 'alliance'],
          'Economy and Entrepreneurship': ['startup', 'innovation', 'economy', 'venture', 'growth'],
          'Innovation and Technology': ['innovation', 'tech', 'startup', 'research', 'development'],
          'History and Heritage': ['heritage', 'culture', 'tradition', 'history', 'ancient'],
          'Holocaust and Revival': ['memorial', 'survival', 'remembrance', 'resilience', 'revival'],
          'Iron Swords War': ['defense', 'security', 'protection', 'operation', 'mission'],
          'Society and Multiculturalism': ['diversity', 'culture', 'community', 'integration', 'society']
        };
        
        requiredWords = topicDefaultWords[topicName] || 
          ['Israel', 'innovation', 'culture', 'history', 'development'];
      }
    }
    
    // Generate post content using the OpenAI API
    const generatedText = await generatePostWithOpenAI(topicName, topic._id.toString(), userId);
    
    if (!generatedText) {
      return res.status(200).json({ 
        text: `🌟 An exciting post about ${topicName} will be shared soon. Stay tuned!`,
        requiredWords
      });
    }

    // Return both the generated text and the required words
    return res.json({ 
      text: generatedText,
      requiredWords
    });

  } catch (error) {
    console.error("Error generating post:", error);
    return res.status(500).json({
      error: "Failed to generate post", 
      details: (error as Error).message || 'Unknown error'
    });
  }
});

export default router;