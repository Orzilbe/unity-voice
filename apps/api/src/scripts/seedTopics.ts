import mongoose from 'mongoose';
import { Topic } from '../models/Topic';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unity-voice';

const topic = [
  {
    _id: 1,
    title: {
      en: 'History and Heritage',
      he: 'הסטוריה ומורשת'
    },
    description: {
      en: 'Explore Israel\'s rich history and cultural heritage',
      he: 'גלה את ההיסטוריה העשירה והמורשת התרבותית של ישראל'
    },
    icon: '🏛️',
    link: '/topic/history',
    difficulty: 'intermediate',
    order: 1,
    levels: [
      {
        type: 'vocabulary',
        content: {
          word: 'Heritage',
          translation: 'מורשת',
          example: 'The heritage of our ancestors is important to preserve.'
        },
        points: 10
      }
    ]
  },
  {
    _id: 2,
    title: {
      en: 'Diplomacy and International Relations',
      he: 'דיפלומטיה ויחסים בינלאומיים'
    },
    description: {
      en: 'Learn about Israel\'s diplomatic relations and international partnerships',
      he: 'למד על יחסי החוץ של ישראל ושותפויות בינלאומיות'
    },
    icon: '🤝',
    link: '/topic/diplomacy',
    difficulty: 'advanced',
    order: 2,
    levels: [
      {
        type: 'vocabulary',
        content: {
          word: 'Diplomacy',
          translation: 'דיפלומטיה',
          example: 'Diplomacy plays a crucial role in international relations.'
        },
        points: 10
      }
    ]
  },
  {
    _id: 3,
    title: {
      en: 'Iron Swords War',
      he: 'מלחמת חרבות ברזל'
    },
    description: {
      en: 'Understanding the recent conflict and its impact',
      he: 'הבנת הסכסוך האחרון והשפעתו'
    },
    icon: '⚔️',
    link: '/topic/security',
    difficulty: 'advanced',
    order: 3,
    levels: [
      {
        type: 'vocabulary',
        content: {
          word: 'Conflict',
          translation: 'סכסוך',
          example: 'The conflict has affected many lives.'
        },
        points: 10
      }
    ]
  },
  {
    _id: 4,
    title: {
      en: 'Innovation and Technology',
      he: 'חדשנות וטכנולוגיה'
    },
    description: {
      en: 'Discover Israel\'s technological advancements and innovations',
      he: 'גלה את ההתקדמות הטכנולוגית והחדשנות של ישראל'
    },
    icon: '💡',
    link: '/topic/innovation',
    difficulty: 'intermediate',
    order: 4,
    levels: [
      {
        type: 'vocabulary',
        content: {
          word: 'Innovation',
          translation: 'חדשנות',
          example: 'Technological innovation drives economic growth.'
        },
        points: 10
      }
    ]
  },
  {
    _id: 5,
    title: {
      en: 'Society and Multiculturalism',
      he: 'חברה ורב תרבותיות'
    },
    description: {
      en: 'Explore the diverse society and cultural aspects of Israel',
      he: 'חקור את החברה המגוונת וההיבטים התרבותיים של ישראל'
    },
    icon: '🌍',
    link: '/topic/society',
    difficulty: 'intermediate',
    order: 5,
    levels: [
      {
        type: 'vocabulary',
        content: {
          word: 'Diversity',
          translation: 'גיוון',
          example: 'Cultural diversity enriches our society.'
        },
        points: 10
      }
    ]
  },
  {
    _id: 6,
    title: {
      en: 'Holocaust and Revival',
      he: 'שואה ותקומה'
    },
    description: {
      en: 'Learn about the Holocaust and the revival of the Jewish people',
      he: 'למד על השואה ותקומת העם היהודי'
    },
    icon: '✡️',
    link: '/topic/holocaust',
    difficulty: 'advanced',
    order: 6,
    levels: [
      {
        type: 'vocabulary',
        content: {
          word: 'Remembrance',
          translation: 'זיכרון',
          example: 'We must never forget the lessons of history.'
        },
        points: 10
      }
    ]
  },
  {
    _id: 7,
    title: {
      en: 'Environment and Sustainability',
      he: 'סביבה וקיימות'
    },
    description: {
      en: 'Explore environmental initiatives and sustainable practices',
      he: 'חקור יוזמות סביבתיות ופרקטיקות מקיימות'
    },
    icon: '🌱',
    link: '/topic/environment',
    difficulty: 'intermediate',
    order: 7,
    levels: [
      {
        type: 'vocabulary',
        content: {
          word: 'Sustainability',
          translation: 'קיימות',
          example: 'Sustainability is crucial for our future.'
        },
        points: 10
      }
    ]
  },
  {
    _id: 8,
    title: {
      en: 'Economy and Entrepreneurship',
      he: 'כלכלה ויזמות'
    },
    description: {
      en: 'Learn about Israel\'s economy and entrepreneurial spirit',
      he: 'למד על הכלכלה הישראלית ורוח היזמות'
    },
    icon: '💰',
    link: '/topic/economy',
    difficulty: 'intermediate',
    order: 8,
    levels: [
      {
        type: 'vocabulary',
        content: {
          word: 'Entrepreneurship',
          translation: 'יזמות',
          example: 'Entrepreneurship drives innovation and economic growth.'
        },
        points: 10
      }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop the collection completely
    await mongoose.connection.collection('topic').drop().catch(() => {
      console.log('Collection does not exist yet, proceeding with creation');
    });
    console.log('Dropped topic collection');

    // Create new topic
    const createdTopics = await Topic.create(topic);
    console.log(`Created ${createdTopics.length} topic`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed(); 