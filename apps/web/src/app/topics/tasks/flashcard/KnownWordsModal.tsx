// src/app/topics/flashcard/KnownWordsModal.tsx

'use client';

import React from 'react';
import { Flashcard } from './types';

interface KnownWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  knownWords: number[];
  flashcards: Flashcard[];
  onUnmarkWord: (wordId: number) => void;
}

const KnownWordsModal: React.FC<KnownWordsModalProps> = ({
  isOpen,
  onClose,
  knownWords,
  flashcards,
  onUnmarkWord
}) => {
  if (!isOpen) return null;

  return (
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
                    onClick={() => onUnmarkWord(id)}
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
          onClick={onClose}
          className="mt-6 w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default KnownWordsModal;