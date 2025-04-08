// src/app/topics/flashcard/QuizComponent.tsx
import React, { useState, useEffect } from 'react';
import { FaStar, FaTrophy, FaStopwatch } from 'react-icons/fa';
import { Flashcard } from './types'; // Adjust the import path as necessary

interface QuizQuestion {
  id: number;
  word: string;
  options: string[];
  correctAnswer: string;
}

interface QuizComponentProps {
  flashcards: Flashcard[];
  topic: string;
  onBack: () => void;
  onComplete: (score: number, totalQuestions: number) => void;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ 
  flashcards, 
  topic, 
  onBack,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Generate quiz questions from flashcards
  useEffect(() => {
    const generateQuiz = () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (flashcards.length < 4) {
          setError("Not enough flashcards to create a quiz. Need at least 4 flashcards.");
          setIsLoading(false);
          return;
        }
        
        // Optionally prioritize known words based on localStorage
        const knownWordsStr = localStorage.getItem(`known_words_${topic}`);
        const knownWordIds = knownWordsStr ? JSON.parse(knownWordsStr) : [];
        
        // Shuffle the flashcards to get a random selection
        let quizWords = [...flashcards].sort(() => Math.random() - 0.5);
        
        // Limit to 7 words for the quiz
        quizWords = quizWords.slice(0, 7);
        
        // Create quiz questions
        const questions: QuizQuestion[] = quizWords.map((flashcard, index) => {
          // Create 3 wrong options
          const otherFlashcards = flashcards.filter(f => f.id !== flashcard.id);
          const shuffledOthers = [...otherFlashcards].sort(() => Math.random() - 0.5);
          
          // Get 3 incorrect translations
          const wrongOptions = shuffledOthers.slice(0, 3).map(f => f.translation);
          
          // Combine correct and wrong options, then shuffle
          const allOptions = [flashcard.translation, ...wrongOptions];
          const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5);
          
          return {
            id: index,
            word: flashcard.word,
            options: shuffledOptions,
            correctAnswer: flashcard.translation
          };
        });
        
        setQuizQuestions(questions);
        setIsLoading(false);
      } catch (error) {
        console.error('Error generating quiz:', error);
        setError('Error generating quiz questions. Please try again.');
        setIsLoading(false);
      }
    };
    
    generateQuiz();
  }, [flashcards, topic]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && !isLoading) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, isLoading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    const isAnswerCorrect = answer === quizQuestions[currentQuestion].correctAnswer;
    setIsCorrect(isAnswerCorrect);
    
    if (isAnswerCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    // Delay before moving to next question
    setTimeout(() => {
      setShowFeedback(false);
      
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer('');
      } else {
        setIsTimerActive(false);
        setShowResultModal(true);
        onComplete(score + (isAnswerCorrect ? 1 : 0), quizQuestions.length);
      }
    }, 1500);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer('');
    setScore(0);
    setStreak(0);
    setTimer(0);
    setIsTimerActive(true);
    setShowResultModal(false);
    
    // Regenerate quiz with different questions
    const shuffledFlashcards = [...flashcards].sort(() => Math.random() - 0.5);
    const quizWords = shuffledFlashcards.slice(0, 7);
    
    const questions: QuizQuestion[] = quizWords.map((flashcard, index) => {
      const otherFlashcards = flashcards.filter(f => f.id !== flashcard.id);
      const shuffledOthers = [...otherFlashcards].sort(() => Math.random() - 0.5);
      const wrongOptions = shuffledOthers.slice(0, 3).map(f => f.translation);
      const allOptions = [flashcard.translation, ...wrongOptions];
      const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5);
      
      return {
        id: index,
        word: flashcard.word,
        options: shuffledOptions,
        correctAnswer: flashcard.translation
      };
    });
    
    setQuizQuestions(questions);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-700">Preparing your quiz questions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || quizQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || "Not enough words to create a quiz"}</h2>
          <p className="text-gray-600 mb-6">Please learn more words first before taking the quiz.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300"
          >
            Back to Flashcards
          </button>
        </div>
      </div>
    );
  }

  // Results modal
  if (showResultModal) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 flex justify-center items-center">
        <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Quiz Results! 🎉
          </h2>
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <p className="text-2xl text-gray-800 font-semibold">
              Your Score: <span className="text-blue-600">{score}</span> out of {quizQuestions.length}
            </p>
            <p className="text-gray-600 mt-2">Time taken: {formatTime(timer)}</p>
            
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Score</span>
                <span className="text-sm font-medium text-gray-700">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${percentage >= 70 ? 'bg-green-600' : 'bg-yellow-500'}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Message based on score */}
            {percentage >= 90 && (
              <div className="mt-4 text-center bg-yellow-100 p-3 rounded-lg">
                <p className="text-yellow-700">🏆 Perfect! You've mastered these words! 🏆</p>
              </div>
            )}
            {percentage >= 70 && percentage < 90 && (
              <div className="mt-4 text-center bg-blue-100 p-3 rounded-lg">
                <p className="text-blue-700">🌟 Great job! You know these words well! 🌟</p>
              </div>
            )}
            {percentage < 70 && (
              <div className="mt-4 text-center bg-indigo-100 p-3 rounded-lg">
                <p className="text-indigo-700">🚀 Keep practicing! You'll improve! 🚀</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <button
              onClick={restartQuiz}
              className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-xl font-medium"
            >
              Try Again 🔄
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-xl font-medium"
            >
              Back to Flashcards 🔤
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 relative">
      {/* Add Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Open Sans', sans-serif;
        }
        h1, h2, h3, h4, h5, h6, button {
          font-family: 'Rubik', sans-serif;
        }
      `}</style>
      
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-4 mt-2">{topic} Vocabulary Quiz</h1>

      {/* Stats Header */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 shadow-lg mb-6 mt-6">
        <div className="flex justify-between items-center">
          <div className="text-center transform hover:scale-110 transition-all duration-300">
            <FaStar className="text-yellow-500 text-3xl mb-2 mx-auto" />
            <div className="text-3xl font-bold text-blue-600 mb-1">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          <div className="text-center transform hover:scale-110 transition-all duration-300">
            <FaTrophy className="text-indigo-500 text-3xl mb-2 mx-auto" />
            <div className="text-3xl font-bold text-blue-600 mb-1">{streak}</div>
            <div className="text-sm text-gray-600">Streak</div>
          </div>
          <div className="text-center transform hover:scale-110 transition-all duration-300">
            <FaStopwatch className="text-blue-500 text-3xl mb-2 mx-auto" />
            <div className="text-3xl font-bold text-blue-600 mb-1">{formatTime(timer)}</div>
            <div className="text-sm text-gray-600">Time</div>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <main className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
          Question {currentQuestion + 1} of {quizQuestions.length}
        </h2>
        <p className="text-xl text-gray-700 mb-8">
          Choose the correct translation for: <span className="font-bold text-2xl text-blue-600">{quizQuestions[currentQuestion]?.word}</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizQuestions[currentQuestion]?.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !showFeedback && handleAnswerSelect(option)}
              className={`p-6 rounded-xl text-lg font-semibold transition-all duration-300 ${
                showFeedback
                  ? option === quizQuestions[currentQuestion].correctAnswer
                    ? 'bg-green-100 border-2 border-green-500 text-green-800'
                    : selectedAnswer === option
                      ? 'bg-red-100 border-2 border-red-500 text-red-800'
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  : selectedAnswer === option
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white transform scale-105 shadow-md' 
                    : 'bg-white text-gray-700 border-2 border-blue-200 hover:border-blue-400 hover:scale-105'
              }`}
              disabled={showFeedback}
            >
              {option}
            </button>
          ))}
        </div>
        
        {/* Feedback message */}
        {showFeedback && (
          <div className={`mt-6 p-4 rounded-xl text-center ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isCorrect 
              ? 'Correct answer! Well done! 👏' 
              : `Incorrect. The correct answer is: ${quizQuestions[currentQuestion].correctAnswer}`
            }
          </div>
        )}
        
        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
          >
            ← Back to Flashcards
          </button>
        </div>
      </main>
    </div>
  );
};

export default QuizComponent;