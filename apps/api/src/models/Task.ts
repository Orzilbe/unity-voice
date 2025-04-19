// apps/api/src/models/Task.ts
import mongoose from 'mongoose';

export enum TaskType {
  WORD = 'word',
  QUIZ = 'quiz',
  POST = 'post',
  CONVERSATION = 'conversation'
}

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  taskScore: { type: Number, required: true, default: 0 },
  taskType: { type: String, required: true, enum: Object.values(TaskType) },
  completionDate: { type: Date },
  durationTask: { type: Number },
  userId: { type: String, required: true },
  level: { type: Number, required: true },
  topic: { type: String, required: true }
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;