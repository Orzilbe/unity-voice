// apps/api/src/models/WordInTask.ts
import mongoose from 'mongoose';

const wordInTaskSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  wordId: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 }
}, { timestamps: true });

// Create a compound index on taskId and wordId to ensure uniqueness
wordInTaskSchema.index({ taskId: 1, wordId: 1 }, { unique: true });

const WordInTask = mongoose.model('WordInTask', wordInTaskSchema);

export default WordInTask;