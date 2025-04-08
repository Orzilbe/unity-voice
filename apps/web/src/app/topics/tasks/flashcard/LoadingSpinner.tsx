// src/app/topics/flashcard/LoadingSpinner.tsx

'use client';

import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'טוען...' }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin mb-4"></div>
      <p className="text-lg font-medium text-gray-700">{message}</p>
    </div>
  );
};

export default LoadingSpinner;