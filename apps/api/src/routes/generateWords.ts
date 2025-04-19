// apps/api/src/routes/generateWords.ts (updated version)
import { Request, Response } from 'express';
import { protect } from '../middlewares/auth';
import { OpenAIClient } from '../services/openai';
import User from '../models/User';
import Task from '../models/Task';
import WordInTask from '../models/WordInTask';

/**
 * @route   POST /api/generate-words
 * @desc    Generate personalized flashcards based on user's level, topic, and previous learning history
 * @access  Private
 */
export const generateWordsHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { topic, level = 1 } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }

    // Get user's English level
    const user = await User.findOne({ _id: req.user.userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userEnglishLevel = user.englishLevel || 'intermediate';

    // Get words the user has already learned
    const userTasks = await Task.find({ userId: req.user.userId });
    const taskIds = userTasks.map(task => task.taskId);
    
    const learnedWords = await WordInTask.find({
      taskId: { $in: taskIds }
    });
    
    const learnedWordIds = learnedWords.map(word => word.wordId);

    // Generate flashcards using OpenAI
    const openAI = new OpenAIClient();
    const flashcards = await generateFlashcardsWithOpenAI(
      openAI,
      topic,
      userEnglishLevel,
      learnedWordIds,
      typeof level === 'string' ? parseInt(level) : level
    );

    return res.status(200).json({
      success: true,
      data: flashcards
    });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return res.status(500).json({
      success: false,
      error: 'Error generating flashcards'
    });
  }
};

/**
 * Generate flashcards using OpenAI with an optimized prompt
 */
async function generateFlashcardsWithOpenAI(
  openAI: OpenAIClient,
  topic: string,
  userLevel: string,
  learnedWordIds: string[],
  level: number
) {
  // Map topic names to more descriptive contexts for the AI
  const topicContexts: Record<string, string> = {
    'iron-swords': 'the 2023 Israel-Hamas conflict, military terminology, security operations, and defensive measures',
    'security': 'military terminology, security operations, defense systems, and protective measures',
    'diplomacy': 'international relations, peace negotiations, treaties, diplomatic missions, and global cooperation',
    'history-and-heritage': 'Israeli history, Jewish heritage, archaeological findings, historical events, and cultural traditions',
    'innovation': 'Israeli technology startups, scientific breakthroughs, entrepreneurship, and technological advancements',
    'society': 'Israeli society, cultural diversity, social structures, community organizations, and daily life',
    'holocaust': 'Holocaust history, survivor stories, memorials, and Jewish European history during WWII',
    'environment': 'environmental conservation, climate initiatives, sustainable practices, and natural resources in Israel',
    'economy': 'Israeli economy, financial systems, business sectors, trade relations, and economic development'
  };

  // Get the detailed topic context or default to the topic name
  const topicContext = topicContexts[topic] || topic;

  // Adjust the difficulty level based on user's English level
  let wordComplexity = '';
  let sentenceComplexity = '';
  
  switch(userLevel.toLowerCase()) {
    case 'beginner':
      wordComplexity = 'simple, common vocabulary that beginners would encounter';
      sentenceComplexity = 'short, simple sentences with basic grammar structures';
      break;
    case 'intermediate':
      wordComplexity = 'moderately complex vocabulary that intermediate learners would be ready to learn';
      sentenceComplexity = 'moderately complex sentences with some compound structures';
      break;
    case 'advanced':
      wordComplexity = 'sophisticated vocabulary including academic and specialized terms';
      sentenceComplexity = 'complex sentences with varied structures including passive voice and conditionals';
      break;
    default:
      wordComplexity = 'moderately complex vocabulary';
      sentenceComplexity = 'clear, straightforward sentences';
  }

  // Format the already learned words list
  const learnedWordsNote = learnedWordIds.length > 0 
    ? `The user has already learned the following words (DO NOT include any of these): ${learnedWordIds.join(', ')}`
    : 'The user has not learned any words on this topic yet.';

  // Create the prompt with detailed instructions
  const prompt = `
    You are a language learning expert specialized in teaching English vocabulary about ${topicContext} to Hebrew speakers.

    Create ${level > 3 ? '7-8' : '5-7'} high-quality flashcards in JSON format for a ${userLevel} level English learner studying the topic "${topic}" at level ${level}.

    ${learnedWordsNote}

    Guidelines for the flashcards:
    1. Each word should be directly relevant to ${topicContext}
    2. Use ${wordComplexity}
    3. Example sentences should use ${sentenceComplexity}
    4. Provide accurate Hebrew translations
    5. Include a mix of nouns, verbs, adjectives, and phrases
    6. For level ${level}, focus on ${level <= 2 ? 'fundamental' : level <= 4 ? 'intermediate' : 'advanced'} terminology
    7. All examples should be factually accurate and culturally appropriate
    8. Ensure examples demonstrate natural, contextual usage of the word

    Return ONLY the following JSON array with no additional text:
    [
      {
        "id": 1,
        "word": "English word",
        "translation": "Hebrew translation",
        "example": "Example sentence using the word in context",
        "difficulty": "${userLevel.toLowerCase()}"
      },
      ...
    ]
  `;

  try {
    // Call OpenAI with the optimized prompt
    const response = await openAI.generateContent(prompt);
    
    // Parse and validate the generated flashcards
    let flashcards;
    try {
      const content = response.choices[0]?.message?.content || '';
      // Extract JSON from the response (in case there's any additional text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        flashcards = JSON.parse(content);
      }
    } catch (err) {
      console.error('Error parsing OpenAI response:', err);
      throw new Error('Invalid response format from OpenAI');
    }
    
    // Validate flashcards structure
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error('Invalid flashcards structure');
    }
    
    return flashcards;
  } catch (error) {
    console.error('OpenAI generation error:', error);
    throw error;
  }
}

export default generateWordsHandler;