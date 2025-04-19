//apps/web/src/components/Flashcard.tsx
import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface FlashcardProps {
  word: {
    _id: string;
    word: string;
    translation: string;
    topicId: string;
    example?: string;
  };
  onRemove?: (wordId: string) => void;
  userToken?: string;
}

export const Flashcard: React.FC<FlashcardProps> = ({ word, onRemove, userToken }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleMarkLearned = async () => {
    if (!userToken) {
      setError('Please log in to mark words as learned');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/flashcards/mark-learned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          wordId: word._id,
          topicId: word.topicId
        })
      });

      const data = await response.json();
      if (data.success) {
        onRemove?.(word._id);
      } else {
        setError(data.error || 'Failed to mark word as learned');
      }
    } catch (error) {
      console.error('Error marking word as learned:', error);
      setError('Failed to mark word as learned. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="relative bg-white rounded-lg shadow-md p-6 m-4 max-w-sm w-full cursor-pointer transform transition-transform hover:scale-105"
      onClick={() => setIsFlipped(!isFlipped)}
      style={{ perspective: '1000px' }}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-300 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front side */}
        <div className={`absolute w-full h-full backface-hidden ${isFlipped ? 'hidden' : ''}`}>
          <h3 className="text-xl font-bold mb-2 text-gray-800">{word.word}</h3>
          {word.example && (
            <p className="text-sm text-gray-600 mb-4 italic">"{word.example}"</p>
          )}
        </div>

        {/* Back side */}
        <div className={`absolute w-full h-full backface-hidden rotate-y-180 ${!isFlipped ? 'hidden' : ''}`}>
          <p className="text-lg text-gray-700">{word.translation}</p>
        </div>
      </div>

      {error && (
        <div className="absolute bottom-2 left-2 right-2 text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleMarkLearned();
        }}
        className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-sm transition-colors"
        disabled={isLoading}
      >
        {isLoading ? <LoadingSpinner /> : 'Mark as Learned'}
      </button>
    </div>
  );
};

export default Flashcard; 