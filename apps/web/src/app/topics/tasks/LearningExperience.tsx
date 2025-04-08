'use client';

import React, { useState } from 'react';
import Flashcards from './flashcard/Flashcards';
import SocialMediaPractice from './social-media/SocialMediaPractice';
import InteractiveConversation from './conversation/InteractiveConversation';
import { Topic } from './flashcard/types';

interface LearningExperienceProps {
  topic: Topic;
  pageTitle: string;
  initialDifficulty?: 'beginner' | 'intermediate' | 'advanced';
}

type LearningStage = 'flashcards' | 'social-media' | 'conversation';

export default function LearningExperience({
  topic,
  pageTitle,
  initialDifficulty = 'beginner'
}: LearningExperienceProps) {
  const [stage, setStage] = useState<LearningStage>('flashcards');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(initialDifficulty);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [completedStages, setCompletedStages] = useState<LearningStage[]>([]);

  const handleFlashcardsComplete = (words: string[]) => {
    setLearnedWords(words);
    setStage('social-media');
  };

  const handleSocialMediaComplete = (points: number) => {
    setTotalPoints(prev => prev + points);
    setCompletedStages(prev => [...prev, 'social-media']);
    setStage('conversation');
  };

  const handleConversationComplete = (points: number) => {
    setTotalPoints(prev => prev + points);
    setCompletedStages(prev => [...prev, 'conversation']);
  };

  const handleStageChange = (newStage: LearningStage) => {
    if (newStage === 'flashcards' || completedStages.includes(newStage)) {
      setStage(newStage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">{pageTitle}</h1>
        
        <div className="mb-8">
          <div className="flex justify-center space-x-4 mb-4">
            <button
              onClick={() => handleStageChange('flashcards')}
              className={`px-6 py-3 rounded-lg ${
                stage === 'flashcards'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Vocabulary Learning
            </button>
            <button
              onClick={() => handleStageChange('social-media')}
              className={`px-6 py-3 rounded-lg ${
                stage === 'social-media'
                  ? 'bg-blue-600 text-white'
                  : completedStages.includes('social-media')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-700'
              }`}
              disabled={!completedStages.includes('social-media') && stage !== 'social-media'}
            >
              Social Media Practice
            </button>
            <button
              onClick={() => handleStageChange('conversation')}
              className={`px-6 py-3 rounded-lg ${
                stage === 'conversation'
                  ? 'bg-blue-600 text-white'
                  : completedStages.includes('conversation')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-700'
              }`}
              disabled={!completedStages.includes('conversation') && stage !== 'conversation'}
            >
              Interactive Conversation
            </button>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setDifficulty('beginner')}
              className={`px-4 py-2 rounded-lg ${
                difficulty === 'beginner'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Beginner
            </button>
            <button
              onClick={() => setDifficulty('intermediate')}
              className={`px-4 py-2 rounded-lg ${
                difficulty === 'intermediate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Intermediate
            </button>
            <button
              onClick={() => setDifficulty('advanced')}
              className={`px-4 py-2 rounded-lg ${
                difficulty === 'advanced'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Advanced
            </button>
          </div>
        </div>

        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total Points: {totalPoints}</span>
            <span className="text-sm text-gray-600">
              {completedStages.length}/3 stages completed
            </span>
          </div>
        </div>

        {stage === 'flashcards' && (
          <Flashcards
            topic={topic}
            pageTitle={pageTitle}
            initialDifficulty={difficulty}
            onComplete={handleFlashcardsComplete}
          />
        )}

        {stage === 'social-media' && (
          <SocialMediaPractice
            topic={topic}
            difficulty={difficulty}
            learnedWords={learnedWords}
            onComplete={handleSocialMediaComplete}
          />
        )}

        {stage === 'conversation' && (
          <InteractiveConversation
            topic={topic}
            difficulty={difficulty}
            onComplete={handleConversationComplete}
          />
        )}
      </div>
    </div>
  );
} 