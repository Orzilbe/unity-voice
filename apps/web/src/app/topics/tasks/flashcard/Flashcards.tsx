'use client';

import React, { useState, useEffect } from 'react';
import { FaVolumeUp } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QuizComponent from './QuizComponent';
import { Flashcard, Topic } from './types';
import UserProfile from '../../../components/UserProfile';
import { generateFlashcards } from './flashcardService';
import { Word } from '@unity-voice/types';

interface FlashcardsProps {
  topic: Topic;
  pageTitle: string;
  initialDifficulty: string;
  currentLevel: number;
  onComplete: () => void;
}

export default function Flashcards({ 
  topic, 
  pageTitle, 
  initialDifficulty,
  currentLevel,
  onComplete 
}: FlashcardsProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [knownWords, setKnownWords] = useState<number[]>([]);
  const [showKnownWordsModal, setShowKnownWordsModal] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'normal' | 'slow'>('normal');
  const [showProfile, setShowProfile] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<Flashcard[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const response = await fetch(`/api/topic/${topic}/words?level=${currentStage}&difficulty=${initialDifficulty}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch words');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setWords(data.data);
        } else {
          throw new Error('Invalid data received');
        }
      } catch (err) {
        console.error('Error fetching words:', err);
        setError(err instanceof Error ? err.message : 'Failed to load words');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWords();
  }, [topic, currentStage, initialDifficulty]);

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      setQuizCompleted(true);
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const markAsKnown = () => {
    const currentId = filteredFlashcards[currentCard]?.id;
    if (currentId !== undefined && !knownWords.includes(currentId)) {
      setKnownWords(prev => [...prev, currentId]);
      
      const updatedFilteredCards = filteredFlashcards.filter(card => card.id !== currentId);
      setFilteredFlashcards(updatedFilteredCards);
      
      const newCurrentCard = currentCard >= updatedFilteredCards.length ? 
        Math.max(0, updatedFilteredCards.length - 1) : currentCard;
      
      setCurrentCard(newCurrentCard);
      setShowTranslation(false);
      
      // שמירה ב-localStorage
      localStorage.setItem(`known_words_${topic}`, JSON.stringify([...knownWords, currentId]));
    }
  };

  const unmarkAsKnown = (wordId: number) => {
    const wordToRemove = flashcards.find(card => card.id === wordId);
    if (!wordToRemove) return;

    // הסרה מהמילים הידועות
    const updatedKnownWords = knownWords.filter(id => id !== wordId);
    setKnownWords(updatedKnownWords);
    
    // הוספה בחזרה לרשימת המילים המסוננת
    setFilteredFlashcards([...filteredFlashcards, wordToRemove].sort((a, b) => a.id - b.id));
    
    // עדכון localStorage
    localStorage.setItem(`known_words_${topic}`, JSON.stringify(updatedKnownWords));
  };

  const handlePlayPronunciation = () => {
    const word = filteredFlashcards[currentCard]?.word;
    if (!word) return;

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = playbackSpeed === 'slow' ? 0.7 : 1;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const toggleProfile = () => setShowProfile(!showProfile);

  const resetLearning = () => {
    // איפוס כל ההתקדמות
    setFilteredFlashcards([...flashcards]);
    setKnownWords([]);
    setCurrentCard(0);
    setShowTranslation(false);
    localStorage.removeItem(`known_words_${topic}`);
  };
  
  const handleQuizComplete = (score: number, totalQuestions: number) => {
    console.log(`Quiz completed with score: ${score}/${totalQuestions}`);
    // אפשרות לשמור תוצאות בוחן ב-localStorage
    localStorage.setItem(`quiz_results_${topic}`, JSON.stringify({ 
      score, 
      totalQuestions,
      date: new Date().toISOString()
    }));
  };
  
  const startQuiz = () => {
    setShowQuiz(true);
  };
  
  const backToFlashcards = () => {
    setShowQuiz(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
        <p className="text-lg mb-6">You've finished all the words in this level.</p>
        <button
          onClick={onComplete}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Continue to Posts
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8">{pageTitle}</h1>
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">{currentWord?.word}</h2>
          {showAnswer && (
            <div className="mt-4">
              <p className="text-gray-600">{currentWord?.translation}</p>
              <p className="text-sm text-gray-500 mt-2">{currentWord?.example}</p>
            </div>
          )}
        </div>
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            {currentIndex === words.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
