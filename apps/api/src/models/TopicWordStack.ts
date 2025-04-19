// apps/api/src/models/TopicWordStack.ts
import mongoose from 'mongoose';

const topicWordStackSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  level: {
    type: Number,
    required: true
  },
  words: [{
    word: String,
    translation: String,
    examples: [String],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Create a compound index for efficient lookup
topicWordStackSchema.index({ topicId: 1, level: 1 });

export interface ITopicWordStack extends mongoose.Document {
  topicId: mongoose.Types.ObjectId;
  level: number;
  words: {
    word: string;
    translation: string;
    examples: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    createdAt: Date;
  }[];
}

const TopicWordStack = mongoose.model<ITopicWordStack>('TopicWordStack', topicWordStackSchema);
export default TopicWordStack; 