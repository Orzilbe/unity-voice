// apps/api/src/models/Word.ts
import mongoose from 'mongoose';
import { Word as WordType } from '@unity-voice/types';

const wordSchema = new mongoose.Schema({
  wordId: { type: String, required: true, unique: true },
  word: { type: String, required: true },
  translation: { type: String, required: true },
  exampleUsage: { type: String, required: true },
  pronunciation: { type: String }
}, { timestamps: true });

const Word = mongoose.model<WordType & mongoose.Document>('Word', wordSchema);

export default Word;