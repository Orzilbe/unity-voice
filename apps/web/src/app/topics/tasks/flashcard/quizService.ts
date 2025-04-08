// src/app/topics/flashcard/quizService.ts
import { Flashcard } from './types';

export interface QuizQuestion {
  word: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
  error?: string;
}

/**
 * Generate quiz questions from OpenAI based on existing flashcards
 */
export async function generateQuizQuestions(
  topic: string,
  flashcards: Flashcard[],
  count: number = 7
): Promise<QuizQuestion[]> {
  try {
    // Prepare existing words to send to OpenAI
    const wordPairs = flashcards.map(card => ({
      word: card.word,
      translation: card.translation
    }));

    // Call OpenAI API to generate quiz questions
    const response = await fetch('/api/generate-flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        existingWords: wordPairs,
        count,
        mode: 'quiz' // This tells our API to generate quiz questions instead of flashcards
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate quiz questions');
    }

    const data: QuizResponse = await response.json();
    
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid response format');
    }

    return data.questions;
  } catch (error) {
    console.error('Error in quiz service:', error);
    throw error;
  }
}

/**
 * Generate quiz questions locally (fallback if API fails)
 */
export function generateLocalQuizQuestions(flashcards: Flashcard[], count: number = 7): QuizQuestion[] {
  if (flashcards.length < 4) {
    throw new Error('Not enough flashcards to create a quiz');
  }

  // Shuffle flashcards to get a random selection
  const shuffledFlashcards = [...flashcards].sort(() => Math.random() - 0.5);
  
  // Take at most 'count' flashcards
  const selectedFlashcards = shuffledFlashcards.slice(0, Math.min(count, flashcards.length));

  // Create quiz questions
  return selectedFlashcards.map((flashcard) => {
    // Create wrong options (3 incorrect translations)
    const otherFlashcards = flashcards.filter(f => f.id !== flashcard.id);
    const shuffledOthers = [...otherFlashcards].sort(() => Math.random() - 0.5);
    const wrongOptions = shuffledOthers.slice(0, 3).map(f => f.translation);
    
    // Combine correct and wrong answers, then shuffle
    const allOptions = [flashcard.translation, ...wrongOptions];
    const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5);
    
    return {
      word: flashcard.word,
      options: shuffledOptions,
      correctAnswer: flashcard.translation
    };
  });
}