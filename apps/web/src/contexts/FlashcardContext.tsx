// apps/web/src/contexts/FlashcardContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// הגדרת טיפוסים
export interface Flashcard {
  _id: string;
  word: string;
  translation: string;
  examples: string[];
  topicId: string;
  level: number;
  difficulty: string;
}

interface FlashcardContextType {
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;
  currentIndex: number;
  learnedWords: string[];
  fetchFlashcards: (topic: string, level: number) => Promise<void>;
  markAsLearned: (flashcardId: string, topicId: string) => Promise<void>;
  nextCard: () => void;
  prevCard: () => void;
}

// יצירת קונטקסט עם ערך ברירת מחדל
const FlashcardContext = createContext<FlashcardContextType>({
  flashcards: [],
  loading: false,
  error: null,
  currentIndex: 0,
  learnedWords: [],
  fetchFlashcards: async () => {},
  markAsLearned: async () => {},
  nextCard: () => {},
  prevCard: () => {}
});

// הוק שימוש בקונטקסט
export const useFlashcards = () => useContext(FlashcardContext);

// ספק הקונטקסט
export const FlashcardProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);

  // פונקציות ליבה
  const fetchFlashcards = async (topic: string, level: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // שליפת כרטיסיות מהשרת
      const response = await fetch(`/api/flashcards?topic=${encodeURIComponent(topic)}&level=${level}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch flashcards: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFlashcards(data.data);
        setCurrentIndex(0);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsLearned = async (flashcardId: string, topicId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // רק שמירה מקומית אם אין אימות
        setLearnedWords(prev => [...prev, flashcardId]);
        return;
      }
      
      // שמירה בשרת
      const response = await fetch('/api/learned-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ flashcardId, topicId })
      });
      
      if (response.ok) {
        setLearnedWords(prev => [...prev, flashcardId]);
      }
    } catch (err) {
      console.error('Error marking word as learned:', err);
    }
  };

  const nextCard = (): void => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevCard = (): void => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // ערך הקונטקסט
  const value = {
    flashcards,
    loading,
    error,
    currentIndex,
    learnedWords,
    fetchFlashcards,
    markAsLearned,
    nextCard,
    prevCard
  };

  return (
    <FlashcardContext.Provider value={value}>
      {children}
    </FlashcardContext.Provider>
  );
};

export default FlashcardProvider;