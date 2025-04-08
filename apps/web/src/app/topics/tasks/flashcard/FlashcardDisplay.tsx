// src/app/topics/flashcard/FlashcardDisplay.tsx

'use client';

import React from 'react';
import { Flashcard } from './types';

interface FlashcardDisplayProps {
  flashcard: Flashcard;
  showTranslation: boolean;
  onToggle: () => void;
}

const FlashcardDisplay: React.FC<FlashcardDisplayProps> = ({
  flashcard,
  showTranslation,
  onToggle
}) => {
  return (
    <div
      className="relative h-72 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl flex flex-col justify-center items-center mb-8 cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-md"
      onClick={onToggle}
    >
      <h2 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
        {showTranslation ? flashcard.translation : flashcard.word}
      </h2>
      {!showTranslation && (
        <p className="text-gray-600 text-xl italic mt-6 px-12 text-center">
          {flashcard.example}
        </p>
      )}
    </div>
  );
};

export default FlashcardDisplay;