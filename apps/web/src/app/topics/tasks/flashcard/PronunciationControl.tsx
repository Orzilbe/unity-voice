// src/app/topics/flashcard/PronunciationControl.tsx
'use client';

import React from 'react';
import { FaVolumeUp } from 'react-icons/fa';

interface PronunciationControlProps {
  word: string;
  playbackSpeed: 'normal' | 'slow';
  onPlaybackSpeedChange: (speed: 'normal' | 'slow') => void;
  onPlay: () => void;
}

const PronunciationControl: React.FC<PronunciationControlProps> = ({
  word,
  playbackSpeed,
  onPlaybackSpeedChange,
  onPlay
}) => {
  const handlePlay = () => {
    if (!word) return;

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = playbackSpeed === 'slow' ? 0.7 : 1;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
    
    onPlay();
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handlePlay}
        className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 hover:bg-orange-200 transition-colors"
        title="Play pronunciation"
      >
        <FaVolumeUp size={24} />
      </button>
      <select
        value={playbackSpeed}
        onChange={(e) => onPlaybackSpeedChange(e.target.value as 'normal' | 'slow')}
        className="border-2 border-orange-200 text-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-400"
      >
        <option value="normal">Normal Speed</option>
        <option value="slow">Slow Speed</option>
      </select>
    </div>
  );
};

export default PronunciationControl;