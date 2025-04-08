'use client';

import React, { useState } from 'react';

interface WordData {
  word: string;
  translation: string;
  example: string;
}

export default function PotatoWordsPage() {
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWord = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: 'potatoes' })
      });

      if (!response.ok) {
        throw new Error('Failed to generate word');
      }

      const data = await response.json();
      setWordData(data);
    } catch (err) {
      setError('Could not generate word');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-green-700 mb-6">
          Potato Words Generator 🥔
        </h1>

        <button 
          onClick={generateWord}
          disabled={isLoading}
          className="w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors mb-6"
        >
          {isLoading ? 'Generating...' : 'Generate Potato Word'}
        </button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {wordData && (
          <div className="bg-green-50 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-bold text-green-800">Word:</h2>
              <p className="text-2xl">{wordData.word}</p>
            </div>
            <div>
              <h2 className="font-bold text-green-800">Translation:</h2>
              <p>{wordData.translation}</p>
            </div>
            <div>
              <h2 className="font-bold text-green-800">Example:</h2>
              <p className="italic">{wordData.example}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}