import { Word, Quiz, WritingContent, ConversationContent } from '@unity-voice/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class Cache {
  private static instance: Cache;
  private cache: Map<string, CacheEntry<any>>;
  private readonly TTL: number = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  public clear(): void {
    this.cache.clear();
  }
}

// Cache keys
export const CACHE_KEYS = {
  vocabularyQuiz: (words: Word[]) => `vocabulary-quiz-${words.map(w => w.id).join('-')}`,
  writingPrompt: (words: Word[]) => `writing-prompt-${words.map(w => w.id).join('-')}`,
  conversationScenario: (context: string) => `conversation-scenario-${context.substring(0, 50)}`,
  writingFeedback: (response: string) => `writing-feedback-${response.substring(0, 50)}`,
  conversationFeedback: (messages: string[]) => `conversation-feedback-${messages.join('-').substring(0, 50)}`
};

export default Cache.getInstance(); 