// apps/api/src/models/Level.ts
import mongoose from 'mongoose';

// Task interface
export interface ITask {
  _id: mongoose.Types.ObjectId;
  type: string;
  content: any;
  difficulty: string;
  points: number;
  timeLimit?: number;
}

// Level interface
export interface ILevel extends mongoose.Document {
  topicId: mongoose.Types.ObjectId | string;
  order: number;
  title: string;
  description: string;
  tasks: ITask[];
  requiredScore: number;
  isLocked: boolean;
}

// Task schema
const taskSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['words', 'post', 'conversation'],
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    required: true
  },
  timeLimit: {
    type: Number
  }
});

// Level schema
const levelSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  tasks: [taskSchema],
  requiredScore: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

const Level = mongoose.model<ILevel>('Level', levelSchema);

export default Level;