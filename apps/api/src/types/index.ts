// apps/api/src/types/index.ts

export enum TaskType {
  VOCABULARY = 'VOCABULARY',
  GRAMMAR = 'GRAMMAR',
  LISTENING = 'LISTENING',
  SPEAKING = 'SPEAKING',
  READING = 'READING',
  WRITING = 'WRITING'
}

export enum SessionType {
  PRACTICE = 'PRACTICE',
  QUIZ = 'QUIZ',
  GAME = 'GAME'
}

export enum TestType {
  PLACEMENT = 'PLACEMENT',
  PROGRESS = 'PROGRESS',
  FINAL = 'FINAL'
}

export interface Badge {
  id: number;
  type: string;
  name: string;
  description: string;
  icon: string;
  dateEarned: Date;
  pointsRequired: number;
} 