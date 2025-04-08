//src/app/topics/tasks/flashcard/ActionButton.tsx
'use client';

import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  label: string;
  primary?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  onClick, 
  label, 
  primary = false 
}) => {
  const baseClasses = "px-8 py-3 rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg";
  const primaryClasses = "bg-green-500 text-white hover:bg-green-600";
  const secondaryClasses = "bg-gray-100 text-gray-700 hover:bg-gray-200";
  
  const buttonClasses = `${baseClasses} ${primary ? primaryClasses : secondaryClasses}`;
  
  return (
    <button 
      onClick={onClick}
      className={buttonClasses}
    >
      {label}
    </button>
  );
};

export default ActionButton;