/**
 * This function creates an optimized prompt for OpenAI based on the user's specific needs
 * 
 * @param topic - The topic to generate flashcards for
 * @param userLevel - The user's English proficiency level
 * @param learnedWordIds - Words the user has already learned (to exclude)
 * @param level - The current level the user is on
 * @returns An engineered prompt for optimal OpenAI responses
 */
export function createOptimizedPrompt(
  topic: string,
  userLevel: string,
  learnedWordIds: string[],
  level: number
): string {
  // Map topic names to more descriptive contexts for the AI
  const topicContexts: Record<string, string> = {
    'iron-swords': 'the 2023 Israel-Hamas conflict, military terminology, security operations, and defensive measures',
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
  return `
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
} 