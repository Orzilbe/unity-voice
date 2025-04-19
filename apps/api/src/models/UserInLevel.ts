// apps/api/src/models/UserInLevel.ts
import mongoose from 'mongoose';
import { UserInLevel as UserInLevelType } from '@unity-voice/types';

const userInLevelSchema = new mongoose.Schema({
  level: { 
    type: Number, 
    required: true 
  },
  topic: {
    topicName: { 
      type: String, 
      required: true 
    },
    topicHe: { 
      type: String, 
      required: true 
    },
    icon: { 
      type: String, 
      required: true 
    }
  },
  userId: { 
    type: String, 
    required: true 
  },
  EarnedScore: { 
    type: Number, 
    default: 0 
  },
  completedAt: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  IsCompleted: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

const UserInLevel = mongoose.model<UserInLevelType & mongoose.Document>('UserInLevel', userInLevelSchema);

export default UserInLevel;