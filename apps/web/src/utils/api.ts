import { getToken } from './auth';

interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface Flashcard {
  _id: string;
  word: string;
  translation: string;
  level: number;
  topicId: string;
}

interface LearnedWord {
  flashcardId: string;
  topicId: string;
  timestamp: string;
}

export async function fetchFlashcards(topic: string, level: number = 1): Promise<Flashcard[]> {
  try {
    const response = await fetch(
      `/api/flashcards?topic=${encodeURIComponent(topic)}&level=${level}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching flashcards: ${response.status}`);
    }

    const data: APIResponse<Flashcard[]> = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch flashcards');
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error calling flashcards server:', error);
    return [];
  }
}

export async function fetchLearnedWords(topic: string): Promise<LearnedWord[]> {
  try {
    const token = getToken();
    const response = await fetch(
      `/api/learned-words?topic=${encodeURIComponent(topic)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching learned words: ${response.status}`);
    }

    const data: APIResponse<LearnedWord[]> = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch learned words');
    }

    return data.data || [];
  } catch (error) {
    console.error('Error calling learned words server:', error);
    return [];
  }
}

export async function saveLearnedWord(flashcardId: string, topicId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/learned-words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        flashcardId,
        topicId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Error saving learned word: ${response.status}`);
    }

    const data: APIResponse<any> = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error saving learned word:', error);
    return false;
  }
} 