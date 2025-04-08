'use client';

import React, { useState, useEffect } from 'react';
import { FaVolumeUp } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QuizComponent from './QuizComponent';
import { Flashcard, Topic } from './types';
import UserProfile from '../../../components/UserProfile';
import { generateFlashcards } from './flashcardService';

interface FlashcardsProps {
  topic: Topic;
  pageTitle: string;
  initialDifficulty?: 'beginner' | 'intermediate' | 'advanced';
  onComplete?: (words: string[]) => void;
}

export default function Flashcards({ 
  topic, 
  pageTitle, 
  initialDifficulty = 'beginner',
  onComplete
}: FlashcardsProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [knownWords, setKnownWords] = useState<number[]>([]);
  const [showKnownWordsModal, setShowKnownWordsModal] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'normal' | 'slow'>('normal');
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<Flashcard[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);

  const router = useRouter();

  // טעינת מילים מ-localStorage או מברירת המחדל
  useEffect(() => {
    const loadFlashcards = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // ניסיון לטעון מילים מה-localStorage
        const savedCards = localStorage.getItem(`flashcards_${topic}`);
        
        if (savedCards) {
          // יש מילים שמורות - נשתמש בהן
          const parsedCards = JSON.parse(savedCards);
          setFlashcards(parsedCards);
          
          // טעינת מילים ידועות
          const savedKnownWords = localStorage.getItem(`known_words_${topic}`);
          const knownWordIds = savedKnownWords ? JSON.parse(savedKnownWords) : [];
          setKnownWords(knownWordIds);
          
          // פילטור המילים הידועות
          setFilteredFlashcards(
            parsedCards.filter((card: Flashcard) => !knownWordIds.includes(card.id))
          );
        } else {
          // אין מילים שמורות - נשתמש בברירת מחדל או ננסה API
          await generateNewWords();
        }
      } catch (error) {
        console.error('Error loading flashcards:', error);
        setError('שגיאה בטעינת המילים');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFlashcards();
  }, [topic, initialDifficulty]);
  
  // פונקציה ליצירת מילים חדשות - עם קריאה אמיתית ל-OpenAI
  const generateNewWords = async () => {
    setError(null);
    
    try {
      const newWords = await generateFlashcards(topic, initialDifficulty);
      
      if (!newWords || newWords.length === 0) {
        throw new Error('No words generated');
      }
      
      const updatedFlashcards = [...newWords]; 
      setFlashcards(updatedFlashcards);
      
      // Filter out known words
      const filteredUpdated = updatedFlashcards.filter(card => !knownWords.includes(card.id));
      
      setFilteredFlashcards(filteredUpdated);
      setCurrentCard(0); // Reset to first card
      
      // Save to localStorage
      localStorage.setItem(`flashcards_${topic}`, JSON.stringify(updatedFlashcards));
      
      return newWords;
    } catch (error) {
      console.error('Error generating words:', error);
      
      // Set a user-friendly error message
      setError('Failed to generate new words. Using default set.');
    }
  };

  const handleNext = () => {
    if (currentCard < filteredFlashcards.length - 1) {
      setCurrentCard(prev => prev + 1);
      setShowTranslation(false);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(prev => prev - 1);
      setShowTranslation(false);
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

      // If all cards are learned and onComplete is provided, call it
      if (updatedFilteredCards.length === 0 && onComplete) {
        const learnedWordsList = flashcards
          .filter(card => knownWords.includes(card.id))
          .map(card => card.word);
        onComplete(learnedWordsList);
      }
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

  // תצוגת טעינה
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-700">Loading flashcards...</p>
        </div>
      </div>
    );
  }
  
  // תצוגת שגיאה כשאין כרטיסיות
  if (error && flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6">Unable to load flashcards. Please try again later.</p>
          <button
            onClick={generateNewWords}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // תצוגת הבוחן אם נבחר
  if (showQuiz) {
    return (
      <QuizComponent 
        flashcards={flashcards}
        topic={topic}
        onBack={backToFlashcards}
        onComplete={handleQuizComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 relative">
      {/* הוספת פונטים של Google */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Open Sans', sans-serif;
        }
        h1, h2, h3, h4, h5, h6, button {
          font-family: 'Rubik', sans-serif;
        }
      `}</style>

      {/* כותרת העמוד */}
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-4 mt-2">{pageTitle}</h1>

      {/* UserProfile Component */}
      <UserProfile isVisible={showProfile} onClose={toggleProfile} showIcon={true} />

      <main className="max-w-4xl mx-auto mt-4">
        {flashcards.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {filteredFlashcards.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-500">
                    Card {currentCard + 1} of {filteredFlashcards.length}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    Learned: {knownWords.length} of {knownWords.length + filteredFlashcards.length}
                  </span>
                </div>

                {/* כרטיסיה */}
                <div
                  className="relative h-72 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex flex-col justify-center items-center mb-8 cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-md"
                  onClick={() => setShowTranslation(!showTranslation)}
                >
                  <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-center px-4 tracking-wide">
                    {showTranslation
                      ? filteredFlashcards[currentCard]?.translation
                      : filteredFlashcards[currentCard]?.word}
                  </h2>
                  {!showTranslation && (
                    <p className="text-gray-700 text-xl mt-6 px-12 text-center leading-relaxed">
                      {filteredFlashcards[currentCard]?.example}
                    </p>
                  )}
                </div>

                {/* כפתורי ניווט */}
                <div className="flex justify-between items-center gap-6 mb-8">
                  <button
                    onClick={handlePrevious}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none shadow-md"
                    disabled={currentCard === 0}
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handlePlayPronunciation}
                      className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-200 transition-colors shadow-sm"
                      title="Play pronunciation"
                    >
                      <FaVolumeUp size={24} />
                    </button>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(e.target.value as 'normal' | 'slow')}
                      className="border-2 border-indigo-200 text-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-400 shadow-sm"
                    >
                      <option value="normal">Normal Speed</option>
                      <option value="slow">Slow Speed</option>
                    </select>
                  </div>
                  <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none shadow-md"
                    disabled={currentCard === filteredFlashcards.length - 1}
                  >
                    Next
                  </button>
                </div>

                {/* כפתורי פעולה */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={markAsKnown}
                    className="px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg font-medium tracking-wide"
                  >
                    I Know This Word ✨
                  </button>
                  <button
                    onClick={() => setShowKnownWordsModal(true)}
                    className="px-8 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg font-medium tracking-wide"
                  >
                    View Known Words 📚
                  </button>
                </div>
                {/* כפתור בוחן */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={startQuiz}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg font-medium tracking-wide"
              >
                Take Quiz 🎯
              </button>
            </div>
            
            {/* כפתור איפוס */}
            <div className="flex justify-center mt-6">
              <button
                onClick={resetLearning}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all transform hover:-translate-y-1 text-sm shadow-md font-medium"
              >
                Reset Progress 🔄
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 Fantastic Job! 🎉</h2>
            <p className="text-gray-700 text-lg mb-8">You've mastered all the flashcards!</p>
            <div className="space-y-4">
              <button
                onClick={startQuiz}
                className="px-8 py-4 w-full bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg text-lg font-medium tracking-wide"
              >
                Start Quiz 🎯
              </button>
              <button
                onClick={resetLearning}
                className="px-8 py-4 w-full bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg text-lg font-medium"
              >
                Reset Progress & Learn Again 🔄
              </button>
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Flashcards Available</h2>
        <p className="text-gray-600 mb-6">Unable to load flashcards. Please try again later.</p>
        <button
          onClick={generateNewWords}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300"
        >
          Try Again
        </button>
      </div>
    )}
  </main>

  {/* חלונית המילים הידועות */}
  {showKnownWordsModal && (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Known Words 🌟</h2>
        {knownWords.length > 0 ? (
          <ul className="space-y-4">
            {knownWords.map((id) => {
              const word = flashcards.find((card) => card.id === id);
              return word && (
                <li key={id} className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                  <span className="font-semibold text-gray-700">{word.word}</span>
                  <button
                    onClick={() => unmarkAsKnown(id)}
                    className="text-red-500 hover:text-red-600 font-medium transition-colors"
                  >
                    Remove ×
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-4">No known words yet.</p>
        )}
        <button
          onClick={() => setShowKnownWordsModal(false)}
          className="mt-6 w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 font-medium tracking-wide shadow-md"
        >
          Close
        </button>
      </div>
    </div>
  )}

  {/* כפתור ניווט לדף הבית */}
  <div className="absolute top-4 left-4">
    <Link 
      href="/topics" 
      className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-105 transition-all duration-300"
    >
      <span className="text-2xl">🏠</span>
    </Link>
  </div>
</div>
);
}
