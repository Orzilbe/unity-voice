// apps/api/src/models/Test.ts
import mongoose, { Schema, Document } from 'mongoose';
import { TestType } from '../types';

export interface ITest extends Document {
  testId: string;
  testScore: number;
  testType: TestType;
  completionDate?: Date;
  durationTest?: number;
  userEmail: string;
}

const TestSchema: Schema = new Schema({
  testId: { type: String, required: true, unique: true },
  testScore: { type: Number, required: true },
  testType: { type: String, enum: Object.values(TestType), required: true },
  completionDate: { type: Date },
  durationTest: { type: Number },
  userEmail: { type: String, ref: 'User', required: true }
});

export default mongoose.model<ITest>('Test', TestSchema);