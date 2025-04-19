// apps/web/src/components/flashcards/TopicFlashcardsPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import FlashcardComponent from '../FlashcardComponent';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed
import { getToken } from '../../utils/auth'


interface Flashcard {
  _id: string;
  word: string;
  translation: string;
  example: string;
  topicId: string;
  level: number;
}

interface UserTopicProgress {
  level: number;
  topicName: string;
  isCompleted: boolean;
}

const TopicFlashcardsPage: React.FC = () => {
  const params = useParams<{ topicName: string }>();
  const searchParams = useSearchParams();
  const topicName = params?.topicName as string;
  // Use level from URL first, fallback to fetched user level
  const urlLevel = searchParams?.get('level');
  
  const [userLevel, setUserLevel] = useState<number>(1);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const token = getToken();

  // First, fetch the user's level for this topic
  useEffect(() => {
    const fetchUserLevel = async () => {
      if (!topicName || !token) return;

      try {
        const response = await fetch(`/api/user-topic-level?topicName=${encodeURIComponent(topicName)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.level) {
            setUserLevel(data.level);
          }
        }
      } catch (error) {
        console.error('Error fetching user level:', error);
        // Continue with default level 1
      }
    };

    fetchUserLevel();
  }, [topicName, token]);

  // Then fetch flashcards once we have the level
  useEffect(() => {
    if (topicName) {
      fetchFlashcards();
    }
  }, [topicName, urlLevel, userLevel, token]);

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
  
      // Use URL level if provided, otherwise use the fetched user level
      const level = urlLevel || userLevel.toString();
      
      // No need to encode here - Next.js will handle this in the dynamic route
      const response = await fetch(`/api/flashcards/${topicName}/${level}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch flashcards');
      }
  
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch flashcards');
      }
  
      setFlashcards(data.data || []);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleWordLearned = (flashcardId: string) => {
    // Remove the word from the state when marked as learned
    setFlashcards(current => current.filter(card => card._id !== flashcardId));
  };

  if (loading) {
    return <div className="loading">Loading flashcards...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (flashcards.length === 0) {
    return <div className="empty-state">No more flashcards available for this topic and level!</div>;
  }

  // Get the current level for display
  const currentLevel = urlLevel || userLevel.toString();

  return (
    <div className="topic-flashcards-container">
      <h1>{topicName} - Level {currentLevel}</h1>
      
      <div className="flashcards-grid">
        {flashcards.map(flashcard => (
          <FlashcardComponent 
            key={flashcard._id} 
            word={flashcard} 
            onWordLearned={handleWordLearned}
          />
        ))}
      </div>
      
      {flashcards.length < 5 && (
        <div className="low-cards-notice">
          You're running low on flashcards for this topic. 
          New flashcards will be generated for you next time you visit!
        </div>
      )}
    </div>
  );
};

export default TopicFlashcardsPage;