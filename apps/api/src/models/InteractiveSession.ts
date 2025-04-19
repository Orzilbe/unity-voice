// apps/api/src/models/InteractiveSession.ts
import mongoose, { Schema, Document } from 'mongoose';
import { SessionType } from '../types';

export interface IInteractiveSession extends Document {
  sessionId: string;
  sessionType: SessionType;
  taskId: string;
}

const InteractiveSessionSchema: Schema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  sessionType: { type: String, enum: Object.values(SessionType), required: true },
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true }
});

export default mongoose.model<IInteractiveSession>('InteractiveSession', InteractiveSessionSchema);