// apps/api/src/models/Topic.ts
import mongoose, { Schema } from 'mongoose';

export interface ITopic extends mongoose.Document {
  topicName: string;
  topicHe: string;
  icon: string;
  order?: number;
  difficulty?: string;
  description?: string;
  descriptionHe?: string;
  levels?: Array<{
    name: string;
    words: Array<{
      word: string;
      translation: string;
      example?: string;
      exampleTranslation?: string;
    }>;
  }>;
}

const TopicSchema: Schema = new mongoose.Schema({
  topicName: { 
    type: String, 
    required: true, 
    unique: true 
  },
  topicHe: { 
    type: String, 
    required: true 
  },
  icon: { 
    type: String, 
    required: true 
  },
  order: {
    type: Number,
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  description: {
    type: String,
    default: ''
  },
  descriptionHe: {
    type: String,
    default: ''
  },
  levels: [{
    name: String,
    words: [{
      word: String,
      translation: String,
      example: String,
      exampleTranslation: String
    }]
  }]
}, { 
  timestamps: true 
});

const Topic = mongoose.model<ITopic>('Topic', TopicSchema);

// Initialize topic as before
const initializeTopics = async () => {
  const topicData = [
    { 
      topicName: 'History and Heritage', 
      topicHe: 'הסטוריה ומורשת', 
      icon: '🏛️' 
    },
    { 
      topicName: 'Diplomacy and International Relations', 
      topicHe: 'דיפלומטיה ויחסים בינלאומיים', 
      icon: '🤝' 
    },
    { 
      topicName: 'Iron Swords War', 
      topicHe: 'מלחמת חרבות ברזל', 
      icon: '⚔️' 
    },
    { 
      topicName: 'Innovation and Technology', 
      topicHe: 'חדשנות וטכנולוגיה', 
      icon: '💡' 
    },
    { 
      topicName: 'Society and Multiculturalism', 
      topicHe: 'חברה ורב תרבותיות', 
      icon: '🌍' 
    },
    { 
      topicName: 'Holocaust and Revival', 
      topicHe: 'שואה ותקומה', 
      icon: '✡️' 
    },
    { 
      topicName: 'Environment and Sustainability', 
      topicHe: 'סביבה וקיימות', 
      icon: '🌱' 
    },
    { 
      topicName: 'Economy and Entrepreneurship', 
      topicHe: 'כלכלה ויזמות', 
      icon: '💰' 
    }
  ];
  for (const topic of topicData) {
    await Topic.findOneAndUpdate(
      { topicName: topic.topicName },
      topic,
      { upsert: true, new: true }
    );
  }
};

// Call initializeTopics when the model is loaded
initializeTopics().catch(console.error);

export default Topic;