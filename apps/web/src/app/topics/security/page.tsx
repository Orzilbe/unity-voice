'use client';

import Flashcards from '../tasks/flashcard/Flashcards';
import { Topic } from '../tasks/flashcard/types';

export default function SecurityFlashcardsPage() {
  const topicName: Topic = 'security';

  return (
    <Flashcards 
      topic={topicName} 
      pageTitle="Security Vocabulary" 
      initialDifficulty="beginner" 
    />
  );
}