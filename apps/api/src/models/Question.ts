// apps/api/src/models/Question.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  questionId: string;
  questionText: string;
  answerText: string;
  feedback?: string;
  sessionId: string;
}

const QuestionSchema: Schema = new Schema({
  questionId: { type: String, required: true, unique: true },
  questionText: { type: String, required: true },
  answerText: { type: String, required: true },
  feedback: { type: String },
  sessionId: { type: Schema.Types.ObjectId, ref: 'InteractiveSession', required: true }
});

export default mongoose.model<IQuestion>('Question', QuestionSchema);