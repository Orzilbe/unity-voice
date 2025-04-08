'use client';

import React, { useState } from 'react';
import { FaVolumeUp } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Flashcard {
  id: number;
  word: string;
  translation: string;
  example: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function Flashcards() {
    const [currentCard, setCurrentCard] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [knownWords, setKnownWords] = useState<number[]>([]);
  const [showKnownWordsModal, setShowKnownWordsModal] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'normal' | 'slow'>('normal');
  const [showProfile, setShowProfile] = useState(false);

  const flashcards: Flashcard[] = [
    { id: 0, word: 'Ancient', translation: 'עַתִיק', example: 'The ancient ruins were fascinating to explore.', difficulty: 'easy' },
    { id: 1, word: 'Historical', translation: 'הִיסטוֹרִי', example: 'The museum has a fascinating collection of historical artifacts.', difficulty: 'medium' },
    { id: 2, word: 'Monument', translation: 'אַנְדַּרְטָה', example: 'The monument honors fallen soldiers.', difficulty: 'hard' },
    { id: 3, word: 'Preserve', translation: 'לְשַׁמֵּר', example: 'We need to preserve our traditions.', difficulty: 'medium' },
    { id: 4, word: 'Tradition', translation: 'מָסוֹרֶת', example: 'Family tradition is important.', difficulty: 'easy' }
  ];

  const [filteredFlashcards, setFilteredFlashcards] = useState<Flashcard[]>(flashcards);

  const router = useRouter();

  const userProfile = {
    fullName: "John Doe",
    email: "johndoe@example.com",
    phoneNumber: "123-456-7890",
    birthDate: "1990-01-01",
    englishLevel: "Intermediate",
  };

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

  const markAsKnown = () => {
    const currentId = filteredFlashcards[currentCard]?.id;
    if (currentId !== undefined && !knownWords.includes(currentId)) {
      setKnownWords((prev) => [...prev, currentId]);
      setFilteredFlashcards((prev) => prev.filter((card) => card.id !== currentId));
      setShowTranslation(false);
    }
  };

  const unmarkAsKnown = (wordId: number) => {
    const wordToRemove = flashcards.find((card) => card.id === wordId);
    if (!wordToRemove) return;

    setKnownWords((prev) => prev.filter((id) => id !== wordId));
    setFilteredFlashcards((prev) => [...prev, wordToRemove].sort((a, b) => a.id - b.id));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 relative">
      {/* Add Google Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

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

      <main className="max-w-4xl mx-auto mt-16">
        {filteredFlashcards.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div
              className="relative h-72 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl flex flex-col justify-center items-center mb-8 cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-md"
              onClick={() => setShowTranslation(!showTranslation)}
            >
              <h2 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
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
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 Fantastic Job! 🎉</h2>
            <p className="text-gray-700 text-lg mb-8">You've mastered all the flashcards!</p>
            <button
              onClick={() => router.push('/topics/history-and-heritage/quiz')}
              className="px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg text-lg"
            >
              Start Quiz 🎯
            </button>
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
          href="/" 
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span className="text-2xl">🏠</span>
        </Link>
      </div>
    </div>
  );
}