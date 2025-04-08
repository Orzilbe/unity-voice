// Define common types used across components
// src/app/topics/flashcard/types.ts

export type Topic = 'diplomacy' | 'history' | 'security' | 'innovation' | 'society' | 'holocaust' | 'environment' | 'economy';

export interface Flashcard {
    id: number;
    word: string;
    translation: string;
    example: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topic: Topic;
    points: number;
    pronunciation?: string;
    usageContext?: string;
  }
  
  export interface UserProfileData {
    fullName: string;
    email: string;
    phoneNumber: string;
    birthDate: string;
    englishLevel: 'beginner' | 'intermediate' | 'advanced';
    points: number;
    rank: string;
    learnedWords: number[];
    completedTopics: string[];
    socialMediaPosts: SocialMediaPost[];
    conversations: Conversation[];
  }

  export interface SocialMediaPost {
    id: number;
    topic: string;
    content: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    userResponse?: string;
    feedback?: {
      contentAccuracy: number;
      writingStyle: number;
      grammar: number;
      wordUsage: number;
      overallScore: number;
      detailedFeedback: string;
    };
    pointsEarned?: number;
  }

  export interface Conversation {
    id: number;
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    transcript: {
      role: 'user' | 'ai';
      content: string;
      timestamp: string;
    }[];
    feedback?: {
      pronunciation: number;
      grammar: number;
      contentAccuracy: number;
      fluency: number;
      overallScore: number;
      detailedFeedback: string;
    };
    pointsEarned?: number;
  }

  export interface QuizQuestion {
    id: number;
    word: string;
    options: string[];
    correctAnswer: string;
    points: number;
  }

  export interface QuizResult {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    pointsEarned: number;
    timeSpent: number;
    feedback: string;
  }

  export interface FlashcardResponse {
    words: Flashcard[];
    error?: string;
  }