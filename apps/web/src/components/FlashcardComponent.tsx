import React, { useState } from 'react';
import { getToken } from '../utils/auth'

interface FlashcardProps {
  word: {
    _id: string;
    word: string;
    translation: string;
    example: string;
    topicId: string;
  };
  onWordLearned: (flashcardId: string) => void;
}

const FlashcardComponent: React.FC<FlashcardProps> = ({ word, onWordLearned }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const userToken = getToken();

  const handleMarkLearned = async () => {
    if (!userToken) {
      alert('You need to be logged in to mark words as learned');
      return;
    }

    try {
      setIsMarking(true);
      
      const response = await fetch('/api/flashcards/mark-learned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          flashcardId: word._id,
          topicId: word.topicId,
          word: word.word
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove the word from the flashcard list
        onWordLearned(word._id);
      }
    } catch (error) {
      console.error('Error marking word as learned', error);
      alert('Failed to mark word as learned');
    } finally {
      setIsMarking(false);
    }
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flashcard-container">
      <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={toggleFlip}>
        <div className="front">
          <h3>{word.word}</h3>
          {word.example && <p className="example">{word.example}</p>}
        </div>
        <div className="back">
          <h3>{word.translation}</h3>
        </div>
      </div>
      
      <button 
        className="mark-learned-btn"
        onClick={handleMarkLearned}
        disabled={isMarking}
      >
        {isMarking ? 'Marking...' : 'סימון כנלמד'}
      </button>
    </div>
  );
};

export default FlashcardComponent;