// apps/api/src/models/UserStats.ts
import mongoose from 'mongoose';
import { UserStats as UserStatsType } from '@unity-voice/types';

const userStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  wordsLearned: {
    type: Number,
    default: 0
  },
  sessionsCompleted: {
    type: Number,
    default: 0
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  lastUpdateDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const UserStats = mongoose.model<UserStatsType & mongoose.Document>('UserStats', userStatsSchema);

export default UserStats;