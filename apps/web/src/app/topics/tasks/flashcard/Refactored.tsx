// apps/web/src/app/topic/tasks/flashcard/Refactored.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { FaVolumeUp } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Flashcard {
  id: number;
  word: string;
  translation: string;
  example: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface RefactoredFlashcardsProps {
  topicId: number;
  pageTitle?: string;
  initialDifficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export default function RefactoredFlashcards({ 
  topicId, 
  pageTitle, 
  initialDifficulty = 'beginner' 
}: RefactoredFlashcardsProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [knownWords, setKnownWords] = useState<number[]>([]);
  const [showKnownWordsModal, setShowKnownWordsModal] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'normal' | 'slow'>('normal');
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map topic IDs to their string names for backward compatibility
  const topicMap: Record<number, string> = {
    1: 'history-and-heritage',
    2: 'diplomacy',
    3: 'iron-swords',
    4: 'innovation',
    5: 'society',
    6: 'holocaust',
    7: 'environment',
    8: 'economy'
  };

  const topic = topicMap[topicId] || 'general';

  // מילים לדוגמה שישמשו כברירת מחדל אם הפעלת ה-API נכשלת
  const defaultFlashcards: Record<string, Flashcard[]> = {
    'security': [
      { id: 1, word: 'Password', translation: 'סיסמה', example: 'Make sure to use a strong password for all your accounts.', difficulty: 'beginner' },
      { id: 2, word: 'Firewall', translation: 'חומת אש', example: 'The company installed a new firewall to protect their network.', difficulty: 'beginner' },
      { id: 3, word: 'Encryption', translation: 'הצפנה', example: 'End-to-end encryption keeps your messages secure.', difficulty: 'beginner' },
      { id: 4, word: 'Authentication', translation: 'אימות', example: 'Two-factor authentication adds an extra layer of security.', difficulty: 'beginner' },
      { id: 5, word: 'Malware', translation: 'תוכנה זדונית', example: 'Always scan email attachments for malware before opening them.', difficulty: 'beginner' },
    ],
    'innovation': [
      { id: 1, word: 'Breakthrough', translation: 'פריצת דרך', example: 'The new invention represents a breakthrough in medical science.', difficulty: 'beginner' },
      { id: 2, word: 'Prototype', translation: 'אב טיפוס', example: 'They developed a working prototype of their new device.', difficulty: 'beginner' },
      { id: 3, word: 'Disruption', translation: 'שיבוש', example: 'This technology caused major disruption in the industry.', difficulty: 'beginner' },
      { id: 4, word: 'Venture', translation: 'מיזם', example: 'They launched a new venture focused on renewable energy.', difficulty: 'beginner' },
      { id: 5, word: 'Pioneer', translation: 'חלוץ', example: 'She was a pioneer in the field of artificial intelligence.', difficulty: 'beginner' },
    ],
    'history-and-heritage': [
      { id: 1, word: 'Legacy', translation: 'מורשת', example: 'He left behind a lasting legacy of scientific achievements.', difficulty: 'beginner' },
      { id: 2, word: 'Artifact', translation: 'ממצא', example: 'The museum displayed ancient artifacts from the excavation.', difficulty: 'beginner' },
      { id: 3, word: 'Heritage', translation: 'מסורת', example: 'They celebrate their cultural heritage through traditional festivals.', difficulty: 'beginner' },
      { id: 4, word: 'Preservation', translation: 'שימור', example: 'Historical preservation ensures these buildings will be enjoyed by future generations.', difficulty: 'beginner' },
      { id: 5, word: 'Dynasty', translation: 'שושלת', example: 'The Ming Dynasty ruled China for nearly 300 years.', difficulty: 'beginner' },
    ],
    'general': [
      { id: 1, word: 'Example', translation: 'דוגמה', example: 'This is an example word.', difficulty: 'beginner' },
      { id: 2, word: 'Practice', translation: 'תרגול', example: 'Practice makes perfect when learning a new language.', difficulty: 'beginner' },
      { id: 3, word: 'Vocabulary', translation: 'אוצר מילים', example: 'Building your vocabulary takes time and effort.', difficulty: 'beginner' },
      { id: 4, word: 'Learning', translation: 'למידה', example: 'Learning new skills is important for personal growth.', difficulty: 'beginner' },
      { id: 5, word: 'Progress', translation: 'התקדמות', example: "You've made good progress in your studies.", difficulty: 'beginner' },
    ]
  };

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<Flashcard[]>([]);

  const router = useRouter();

  const userProfile = {
    fullName: "John Doe",
    email: "johndoe@example.com",
    phoneNumber: "123-456-7890",
    birthDate: "1990-01-01",
    englishLevel: "Intermediate",
  };

  useEffect(() => {
    const loadFlashcards = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load known words from localStorage
        const savedKnownWords = localStorage.getItem(`knownWords_${topic}`);
        if (savedKnownWords) {
          setKnownWords(JSON.parse(savedKnownWords));
        }

        // Fetch flashcards from API
        const response = await fetch(`/api/flashcards?topic=${topic}`);
        if (!response.ok) {
          throw new Error('Failed to fetch flashcards');
        }
        const data = await response.json();
        setFlashcards(data);
      } catch (err) {
        console.error('Error loading flashcards:', err);
        setError('Failed to load flashcards. Using default set.');
        setFlashcards(defaultFlashcards[topic] || defaultFlashcards.general);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlashcards();
  }, [topic]);

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

  const handleKnownWord = (wordId: number) => {
    setKnownWords(prev => {
      const newKnownWords = prev.includes(wordId)
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId];
      
      // Save to localStorage
      localStorage.setItem(`knownWords_${topic}`, JSON.stringify(newKnownWords));
      return newKnownWords;
    });
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
    // שחזור כל המילים מהרשימה השמורה
    const allWords = [...flashcards];
    
    setFilteredFlashcards(allWords);
    setKnownWords([]);
    setCurrentCard(0);
    setShowTranslation(false);
    localStorage.removeItem(`knownWords_${topic}`);
  };

  // אם יש טעינה, הצג ספינר
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-700">טוען מילים...</p>
        </div>
      </div>
    );
  }
  
  // אם יש שגיאה ואין מילים, הצג הודעת שגיאה
  if (error && filteredFlashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6">לא ניתן לטעון את המילים כרגע. נסה שוב מאוחר יותר.</p>
          <button
            onClick={resetLearning}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  // התצוגה הרגילה
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 relative">
      {/* Add Google Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

      {/* כותרת העמוד */}
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 mt-2">{pageTitle || 'Flashcards'}</h1>

      {/* User Profile Icon */}
      <div className="absolute top-4 right-4">
        <div 
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          onClick={toggleProfile}
        >
          <span className="text-2xl">👤</span>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="absolute top-20 right-4 bg-white p-6 shadow-2xl rounded-2xl w-80 z-50 border border-gray-100 transform transition-all duration-300">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Profile</h2>
          <div className="space-y-3">
            <p className="flex items-center text-gray-700"><strong className="min-w-24">Name:</strong> {userProfile.fullName}</p>
            <p className="flex items-center text-gray-700"><strong className="min-w-24">Email:</strong> {userProfile.email}</p>
            <p className="flex items-center text-gray-700"><strong className="min-w-24">Phone:</strong> {userProfile.phoneNumber}</p>
            <p className="flex items-center text-gray-700"><strong className="min-w-24">Birth Date:</strong> {userProfile.birthDate}</p>
            <p className="flex items-center text-gray-700"><strong className="min-w-24">English Level:</strong> 
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm ml-2">
                {userProfile.englishLevel}
              </span>
            </p>
          </div>
          <div className="mt-6 space-y-2">
            <button
              className="w-full py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              onClick={() => alert('Logout Successful!')}
            >
              Logout
            </button>
            <button
              className="w-full py-2.5 bg-gray-400 text-white rounded-xl hover:bg-gray-500 transition-colors"
              onClick={toggleProfile}
            >
              Close
            </button>
          </div>
        </div>
      )}

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
                  {React.createElement(FaVolumeUp, { size: 24 })}
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
                onClick={() => handleKnownWord(filteredFlashcards[currentCard]?.id)}
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
            
            {/* כפתורים נוספים */}
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
                onClick={() => router.push(`/topic/${topic}/quiz`)}
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
                  const word = flashcards.find((card) => card.id === id);
                  return word && (
                    <li key={id} className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                      <span className="font-semibold text-gray-700">{word.word}</span>
                      <button
                        onClick={() => handleKnownWord(id)}
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
          href="/topic" 
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span className="text-2xl">🏠</span>
        </Link>
      </div>
    </div>
  );
}