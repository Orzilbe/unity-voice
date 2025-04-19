import { 
  Flashcard, 
  FlashcardResponse,
  SocialMediaPost,
  Conversation,
  QuizQuestion,
  QuizResult,
  Topic
} from './types';

export async function generateFlashcards(
  topic: Topic, 
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): Promise<Flashcard[]> {
  try {
    
    const response = await fetch(`/api/generate-word/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ difficulty }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch flashcards');
    }

    const data = await response.json();
    
    // Validate the response
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response format');
    }

    return data;
  } catch (error) {
    console.error('Error in flashcard service:', error);
    throw error;
  }
}