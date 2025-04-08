//apps/web/src/app/topics/society/page.tsx
'use client';

import Flashcards from '../tasks/flashcard/Flashcards';


export default function SocietyFlashcardsPage() {
  return (
    <Flashcards 
      topic="society" 
      pageTitle="Society and Multiculturalism Vocabulary" 
      initialDifficulty="beginner" 
    />
  );
}

