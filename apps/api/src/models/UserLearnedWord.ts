// apps/api/src/models/UserLearnedWord.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUserLearnedWord extends Document {
  userId: string;
  flashcardId: string;
  wordId?: string; // Added for backward compatibility
  topicId: string;
  word: string;
  learnedAt: Date;
}

const UserLearnedWordSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true
  },
  flashcardId: {
    type: String,
    required: true
  },
  // Include wordId field in schema but derive it from flashcardId
  wordId: {
    type: String,
    required: false
  },
  topicId: {
    type: String,
    required: true
  },
  word: {
    type: String,
    required: true
  },
  learnedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to ensure wordId is always set to flashcardId value
UserLearnedWordSchema.pre('save', function(next) {
  if (this.flashcardId && !this.wordId) {
    this.wordId = this.flashcardId;
  }
  next();
});

// Create a compound index to ensure uniqueness of learned words per user
UserLearnedWordSchema.index({ userId: 1, wordId: 1 }, { unique: true });

const UserLearnedWord = mongoose.model<IUserLearnedWord>('UserLearnedWord', UserLearnedWordSchema);

export default UserLearnedWord;