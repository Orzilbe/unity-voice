// src/app/topics/flashcard/CompletionCard.tsx
import React from 'react';

interface CompletionCardProps {
  knownWords: string[];
  totalWords: number;
  onReset: () => void;
  onShowKnownWords: () => void;
  onStartQuiz: () => void;  // פונקציה חדשה להתחלת הבוחן
  topic: string;
}

const CompletionCard: React.FC<CompletionCardProps> = ({
  knownWords,
  totalWords,
  onReset,
  onShowKnownWords,
  onStartQuiz,
  topic
}) => {
  const knownPercentage = Math.round((knownWords.length / totalWords) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">
          כל הכבוד! סיימת ללמוד את כל המילים!
        </h2>
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">התקדמות</span>
            <span className="text-sm font-medium text-gray-700">{knownPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full" 
              style={{ width: `${knownPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-gray-600">
            ידעת <span className="font-bold text-gray-800">{knownWords.length}</span> מתוך{' '}
            <span className="font-bold text-gray-800">{totalWords}</span> מילים
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={onStartQuiz}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            התחל בוחן כדי לבדוק את הידע שלך
          </button>
          
          <button
            onClick={onShowKnownWords}
            className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            הצג את המילים שידעת
          </button>
          
          <button
            onClick={onReset}
            className="w-full py-3 px-4 border border-gray-300 hover:bg-gray-100 text-gray-600 font-medium rounded-lg transition-colors"
          >
            למד שוב את כל המילים
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionCard;