// apps/web/src/app/topics/[topicName]/tasks/flashcard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FaVolumeUp } from 'react-icons/fa';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '../../../../../utils/auth';

interface Flashcard {
  _id: string;  // Changed from id to _id to match backend structure
  word: string;
  translation: string;
  example: string;
  topicId: string; // Added to match backend structure
}

export default function DynamicFlashcards() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const topicName = params?.topicName as string;
  const level = searchParams?.get('level') || '1';

  const [currentCard, setCurrentCard] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [knownWords, setKnownWords] = useState<string[]>([]); // Changed from number[] to string[] for _id
  const [showKnownWordsModal, setShowKnownWordsModal] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'normal' | 'slow'>('normal');
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<Flashcard[]>([]);

  // Format the topic name for display
  const formatTopicName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pageTitle = `${formatTopicName(topicName)} - Level ${level}`;

  // Load flashcards and known words on component mount
  useEffect(() => {
    const loadFlashcards = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Start tracking the session duration
        const startTime = Date.now();
        
        // Track whether the component is mounted
        let isMounted = true;

        // Get auth token
        const token = getToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Now fetch flashcards from API - uses the new route format
        const response = await fetch(`/api/flashcards/${encodeURIComponent(topicName)}/${level}`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch flashcards');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load flashcards');
        }
        
        const flashcardsData = data.data;

        if (!Array.isArray(flashcardsData)) {
          throw new Error('Invalid data format: Expected an array of flashcards');
        }

        // Only update state if component is still mounted
        if (isMounted) {
          setFlashcards(flashcardsData);
          setFilteredFlashcards(flashcardsData);
          
          // No need to filter here since our backend API already filters out learned words
          // when the user is authenticated
        }
        
        // Handle cleanup
        return () => {
          isMounted = false;
          // Save session duration when component unmounts
          const sessionDuration = Math.floor((Date.now() - startTime) / 1000); // in seconds
          localStorage.setItem(`lastSessionDuration_${topicName}_${level}`, sessionDuration.toString());
        };
      } catch (err) {
        console.error('Error loading flashcards:', err);
        setError(err instanceof Error ? err.message : 'Failed to load flashcards');
        
        // Use default flashcards if available
        setFlashcards([]);
        setFilteredFlashcards([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlashcards();
  }, [topicName, level]);

  const handleNext = () => {
    if (currentCard < filteredFlashcards.length - 1) {
      setCurrentCard((prev) => prev + 1);
      setShowTranslation(false);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard((prev) => prev - 1);
      setShowTranslation(false);
    }
  };

  const markAsKnown = async () => {
    const currentCardData = filteredFlashcards[currentCard];
    if (!currentCardData) return;
    
    const cardId = currentCardData._id;
    
    try {
      // Get token for authorization
      const token = getToken();
      if (!token) {
        alert('You need to be logged in to mark words as learned');
        return;
      }
      
      // Call the updated API endpoint to mark word as learned
      const response = await fetch('/api/flashcards/mark-learned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flashcardId: cardId,
          topicId: currentCardData.topicId || topicName, // Use topicId from card or fall back to topicName
          word: currentCardData.word // Make sure 'word' is included!
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark word as learned');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update the known words list
        const newKnownWords = [...knownWords, cardId];
        setKnownWords(newKnownWords);
        
        // Remove the word from the filtered flashcards
        const newFilteredFlashcards = filteredFlashcards.filter(card => card._id !== cardId);
        setFilteredFlashcards(newFilteredFlashcards);
        
        // Adjust current card index if necessary
        if (currentCard >= newFilteredFlashcards.length) {
          setCurrentCard(Math.max(0, newFilteredFlashcards.length - 1));
        }
        
        setShowTranslation(false);
        
        // Also keep track in localStorage for fallback/offline support
        localStorage.setItem(`knownWords_${topicName}_${level}`, JSON.stringify(newKnownWords));
      }
    } catch (error) {
      console.error('Error marking word as learned:', error);
      alert('Failed to mark word as learned. Please try again.');
    }
  };

  const unmarkAsKnown = (wordId: string) => {
    // Note: The backend API doesn't support unmarking a word as learned
    // This is just for UI purposes to re-add the word to the current session
    const wordToRemove = flashcards.find((card) => card._id === wordId);
    if (!wordToRemove) return;

    // Remove from known words
    const newKnownWords = knownWords.filter(id => id !== wordId);
    setKnownWords(newKnownWords);
    
    // Add back to filtered flashcards
    const newFilteredFlashcards = [...filteredFlashcards, wordToRemove]
      .sort((a, b) => (a._id > b._id ? 1 : -1));
    setFilteredFlashcards(newFilteredFlashcards);
    
    // Update localStorage
    localStorage.setItem(`knownWords_${topicName}_${level}`, JSON.stringify(newKnownWords));
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
    // Note: This doesn't actually remove words from the server's "learned" list
    // It just resets the local state to show all words again for this session
    setKnownWords([]);
    setFilteredFlashcards([...flashcards]);
    setCurrentCard(0);
    setShowTranslation(false);
    localStorage.removeItem(`knownWords_${topicName}_${level}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-700">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && filteredFlashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6">Unable to load flashcards at this time. Please try again later.</p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300"
            >
              Try Again
            </button>
            <Link 
              href="/topics" 
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300"
            >
              Back to Topics
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 relative">
      {/* Google Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 mt-2">{pageTitle}</h1>

      {/* User Profile Icon */}
      <div className="absolute top-4 right-4">
        <div 
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          onClick={toggleProfile}
        >
          <span className="text-2xl">👤</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto mt-4">
        {filteredFlashcards.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-500">
                Card {currentCard + 1} of {filteredFlashcards.length}
              </span>
              <span className="text-sm font-medium text-gray-500">
                Learned: {knownWords.length} of {knownWords.length + filteredFlashcards.length}
              </span>
            </div>

            <div
              className="relative h-72 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl flex flex-col justify-center items-center mb-8 cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-md"
              onClick={() => setShowTranslation(!showTranslation)}
            >
              <h2 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent text-center px-4">
                {showTranslation
                  ? filteredFlashcards[currentCard]?.translation
                  : filteredFlashcards[currentCard]?.word}
              </h2>
              {!showTranslation && (
                <p className="text-gray-600 text-xl italic mt-6 px-12 text-center">
                  {filteredFlashcards[currentCard]?.example}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center gap-6 mb-8">
              <button
                onClick={handlePrevious}
                className="px-8 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none"
                disabled={currentCard === 0}
              >
                Previous
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePlayPronunciation}
                  className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 hover:bg-orange-200 transition-colors"
                  title="Play pronunciation"
                >
                  <FaVolumeUp size={24} />
                </button>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(e.target.value as 'normal' | 'slow')}
                  className="border-2 border-orange-200 text-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-400"
                >
                  <option value="normal">Normal Speed</option>
                  <option value="slow">Slow Speed</option>
                </select>
              </div>
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none"
                disabled={currentCard === filteredFlashcards.length - 1}
              >
                Next
              </button>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={markAsKnown}
                className="px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg"
              >
                I Know This Word ✨
              </button>
              <button
                onClick={() => setShowKnownWordsModal(true)}
                className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg"
              >
                View Known Words 📚
              </button>
            </div>
            
            {/* Additional buttons */}
            <div className="flex justify-center mt-6 gap-4">
              <button
                onClick={resetLearning}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all transform hover:-translate-y-1 text-sm"
              >
                Reset Progress 🔄
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 Fantastic Job! 🎉</h2>
            <p className="text-gray-700 text-lg mb-8">You've mastered all the flashcards!</p>
            <div className="space-y-4">
              <button
                onClick={() => {
                  router.push(`/topics/${topicName}/tasks/quiz?level=${level}`);
                }}
                className="px-8 py-4 w-full bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg text-lg"
              >
                Start Quiz 🎯
              </button>
              <button
                onClick={resetLearning}
                className="px-8 py-4 w-full bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg text-lg"
              >
                Reset Progress & Learn Again 🔄
              </button>
            </div>
          </div>
        )}
      </main>

      {showKnownWordsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Known Words 🌟</h2>
            {knownWords.length > 0 ? (
              <ul className="space-y-4">
                {knownWords.map((id) => {
                  const word = flashcards.find((card) => card._id === id);
                  return word && (
                    <li key={id} className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
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
              className="mt-6 w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
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