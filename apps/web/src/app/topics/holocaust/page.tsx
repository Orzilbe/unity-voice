'use client';

import Flashcards from '../tasks/flashcard/Flashcards';

export default function SecurityFlashcardsPage() {
  return (
    <Flashcards 
      topic="holocaust" 
      pageTitle="holocaust Vocabulary" 
      initialDifficulty="beginner" 
    />
  );
}