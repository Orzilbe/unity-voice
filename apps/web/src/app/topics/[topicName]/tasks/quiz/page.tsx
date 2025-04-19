// apps/web/src/app/topics/[topicName]/tasks/quiz/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaStar, FaTrophy, FaStopwatch } from 'react-icons/fa';
import { getToken } from '../../../../../utils/auth';

interface QuizQuestion {
  id: string;
  word: string;
  correctAnswer: string;
  options: string[];
}

export default function Quiz() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const topicName = params?.topicName as string;
    const level = searchParams?.get('level') || '1';
  
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(true);
    const [showResultModal, setShowResultModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

   // Fetch learned words for the quiz
   useEffect(() => {
    const fetchQuizWords = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = getToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log(`Fetching quiz words for: ${topicName}, level: ${level}`);
        
        const response = await fetch(`/api/quiz/words/${encodeURIComponent(topicName)}/${level}`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch quiz words');
        }
        
        const data = await response.json();
        console.log('Quiz data received:', data);
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load quiz words');
        }
        
        if (!data.data || data.data.length === 0) {
          throw new Error('No learned words available for quiz. Please learn some words first.');
        }
        
        setQuizQuestions(data.data);
      } catch (err) {
        console.error('Error loading quiz words:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizWords();
  }, [topicName, level]);


  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateQuestionScore = (timeSpent: number, currentStreak: number) => {
    // Base score for correct answer: 20 points
    let questionScore = 20;

    // Time bonus: Up to 5 extra points for quick answers (under 10 seconds)
    const timeBonus = Math.max(0, 5 - Math.floor(timeSpent / 2));
    questionScore += timeBonus;

    // Streak bonus: Up to 5 extra points for maintaining a streak
    const streakBonus = Math.min(5, currentStreak);
    questionScore += streakBonus;

    return questionScore;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    const isCorrect = selectedAnswer === quizQuestions[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // Calculate time spent on this question (assuming timer is in seconds)
      const timePerQuestion = timer / (currentQuestion + 1);
      
      // Calculate score for this question
      const questionScore = calculateQuestionScore(timePerQuestion, newStreak);
      setScore(prev => prev + questionScore);
    } else {
      setStreak(0);
    }
    
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
    } else {
      setIsTimerActive(false);
      
      // Final score adjustments
      setScore(prev => {
        // Time completion bonus: Up to 30 extra points for completing quickly
        const timeCompletionBonus = Math.max(0, 30 - Math.floor(timer / 20));
        
        // Perfect streak bonus: 20 extra points for all correct answers
        const perfectStreakBonus = streak === quizQuestions.length ? 20 : 0;
        
        // Cap total score at 200
        return Math.min(200, prev + timeCompletionBonus + perfectStreakBonus);
      });
      
      setShowResultModal(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer('');
    setScore(0);
    setStreak(0);
    setTimer(0);
    setIsTimerActive(true);
    setShowResultModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-700">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6">Please complete the flashcard exercise first to learn some words.</p>
          <div className="flex flex-col gap-4">
            <Link 
              href={`/topics/${topicName}/tasks/flashcard?level=${level}`}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300"
            >
              Go to Flashcards
            </Link>
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



  const toggleProfile = () => setShowProfile(!showProfile);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 relative">
      {/* Profile Icon */}
      <div className="absolute top-4 right-4">
        <div 
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          onClick={toggleProfile}
        >
          <span className="text-2xl">👤</span>
        </div>
      </div>

    

      {/* Stats Header */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 shadow-lg mb-6 mt-16">
        <div className="flex justify-between items-center">
          <div className="text-center transform hover:scale-110 transition-all duration-300">
            <FaStar className="text-yellow-500 text-3xl mb-2" />
            <div className="text-3xl font-bold text-orange-500 mb-1">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          <div className="text-center transform hover:scale-110 transition-all duration-300">
            <FaTrophy className="text-orange-500 text-3xl mb-2" />
            <div className="text-3xl font-bold text-orange-500 mb-1">{streak}</div>
            <div className="text-sm text-gray-600">Streak</div>
          </div>
          <div className="text-center transform hover:scale-110 transition-all duration-300">
            <FaStopwatch className="text-blue-500 text-3xl mb-2" />
            <div className="text-3xl font-bold text-orange-500 mb-1">{formatTime(timer)}</div>
            <div className="text-sm text-gray-600">Time</div>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <main className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
          Question {currentQuestion + 1} of {quizQuestions.length}
        </h2>
        <p className="text-xl text-gray-700 mb-8">
          Choose the correct translation for: <span className="font-bold text-2xl text-orange-600">{quizQuestions[currentQuestion].word}</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizQuestions[currentQuestion].options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              className={`p-6 rounded-xl text-lg font-semibold transition-all duration-300 ${
                selectedAnswer === option 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white transform scale-105' 
                : 'bg-white text-gray-700 border-2 border-orange-200 hover:border-orange-400 hover:scale-105'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className="mt-8 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-lg font-semibold
                   hover:from-orange-600 hover:to-red-600 transition-all duration-300
                   disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
        >
          Submit Answer
        </button>
      </main>

      {/* Results Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
              Quiz Results! 🎉
            </h2>
            <div className="bg-orange-50 rounded-xl p-6 mb-8">
              <p className="text-2xl text-gray-800 font-semibold">
                Your Score: <span className="text-orange-600">{score}</span> out of 200
              </p>
              <p className="text-gray-600 mt-2">Time taken: {formatTime(timer)}</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={restartQuiz}
                className="w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-xl"
              >
                Try Again 🔄
              </button>
              <button
                onClick={() => router.push(`/topics/${topicName}/tasks/post?level=${level}`)}
                className="w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-xl"
              >
                Next Challenge 🎯
              </button>
            </div>
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