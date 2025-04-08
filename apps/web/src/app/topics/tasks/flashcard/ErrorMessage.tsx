// src/app/topics/flashcard/ErrorMessage.tsx

'use client';

import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
        >
          נסה שוב
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;