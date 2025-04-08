// src/app/topics/flashcard/NavigationButton.tsx
'use client';

import React from 'react';

interface NavigationButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label: string;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({ 
  onClick, 
  disabled = false, 
  label 
}) => {
  return (
    <button
      onClick={onClick}
      className="px-8 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none"
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default NavigationButton;