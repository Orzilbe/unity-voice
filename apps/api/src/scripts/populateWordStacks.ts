import mongoose from 'mongoose';
import Topic from '../models/Topic';
import TopicWordStack from '../models/TopicWordStack';
import dotenv from 'dotenv';

dotenv.config();

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const difficultyToLevel: Record<Difficulty, number> = {
  'beginner': 1,
  'intermediate': 2,
  'advanced': 3
};

// Initial topic data
const topicData = [
  { topicName: 'Holocaust and Revival', topicHe: 'שואה ותקומה', icon: '✡️' },
  { topicName: 'History and Heritage', topicHe: 'הסטוריה ומורשת', icon: '🏛️' },
  { topicName: 'Diplomacy and International Relations', topicHe: 'דיפלומטיה ויחסים בינלאומיים', icon: '🤝' },
  { topicName: 'Iron Swords War', topicHe: 'מלחמת חרבות ברזל', icon: '⚔️' },
  { topicName: 'Innovation and Technology', topicHe: 'חדשנות וטכנולוגיה', icon: '💡' },
  { topicName: 'Society and Multiculturalism', topicHe: 'חברה ורב תרבותיות', icon: '🌍' },
  { topicName: 'Environment and Sustainability', topicHe: 'סביבה וקיימות', icon: '🌱' },
  { topicName: 'Economy and Entrepreneurship', topicHe: 'כלכלה ויזמות', icon: '💰' }
];

// Initial words for each topic organized by difficulty level
const topicWords = {
  'Holocaust and Revival': {
    beginner: [
      { word: 'שואה', translation: 'Holocaust', examples: ['The Holocaust was one of the darkest periods in history.'] },
      { word: 'ניצול', translation: 'Survivor', examples: ['He is a Holocaust survivor.'] },
      { word: 'עם', translation: 'People', examples: ['The Jewish people remember the Holocaust.'] },
      { word: 'מלחמה', translation: 'War', examples: ['World War II was a global war.'] },
      { word: 'שלום', translation: 'Peace', examples: ['After the war, people wanted peace.'] }
    ],
    intermediate: [
      { word: 'זיכרון', translation: 'Memory', examples: ['Holocaust Remembrance Day honors the victims.'] },
      { word: 'עדות', translation: 'Testimony', examples: ['The testimonies of Holocaust survivors are important.'] },
      { word: 'גטו', translation: 'Ghetto', examples: ['Jews were forced to live in ghettos.'] },
      { word: 'נאצים', translation: 'Nazis', examples: ['The Nazis targeted Jews and other minorities.'] },
      { word: 'קורבן', translation: 'Victim', examples: ['Millions were victims of the Holocaust.'] },
      { word: 'השמדה', translation: 'Extermination', examples: ['Extermination camps were built by the Nazis.'] }
    ],
    advanced: [
      { word: 'מחנה ריכוז', translation: 'Concentration Camp', examples: ['Auschwitz was a notorious concentration camp.'] },
      { word: 'תקומה', translation: 'Revival', examples: ['The revival of Israel followed the Holocaust.'] },
      { word: 'עקורים', translation: 'Displaced Persons', examples: ['Many Jews became displaced persons after the war.'] },
      { word: 'צדק היסטורי', translation: 'Historical Justice', examples: ['Survivors demanded historical justice.'] },
      { word: 'הנצחה', translation: 'Commemoration', examples: ['Commemoration is key to remembering the past.'] }
    ]
  },
  // ... other topic will be added here
};

async function ensureTopicsExist() {
  console.log('\nEnsuring topic exist...');
  for (const topicData of topicData) {
    await Topic.findOneAndUpdate(
      { topicName: topicData.topicName },
      topicData,
      { upsert: true, new: true }
    );
    console.log(`Ensured topic exists: ${topicData.topicName}`);
  }
}

async function populateWordStacks() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unity-voice';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // First ensure all topic exist
    await ensureTopicsExist();
    
    // For each topic
    for (const [topicName, difficultyLevels] of Object.entries(topicWords)) {
      console.log(`\nProcessing topic: ${topicName}`);
      
      // Find the topic
      const topic = await Topic.findOne({ topicName });
      
      if (!topic) {
        console.error(`Topic not found: ${topicName}`);
        continue;
      }
      
      // For each difficulty level
      for (const [difficulty, words] of Object.entries(difficultyLevels)) {
        console.log(`Processing difficulty level: ${difficulty}`);
        
        if (!Array.isArray(words)) {
          console.error(`Invalid words array for topic ${topicName}, difficulty ${difficulty}`);
          continue;
        }

        const level = difficultyToLevel[difficulty as Difficulty];
        if (!level) {
          console.error(`Invalid difficulty level: ${difficulty}`);
          continue;
        }
        
        // Check if word stack already exists
        const existingStack = await TopicWordStack.findOne({
          topicId: topic._id,
          level
        });
        
        if (existingStack) {
          console.log(`Stack already exists for ${topicName} level ${level} (${difficulty})`);
          continue;
        }
        
        try {
          // Create word stack for this topic and level
          const wordStack = new TopicWordStack({
            topicId: topic._id,
            level,
            words: words.map(word => ({
              ...word,
              difficulty
            }))
          });
          
          await wordStack.save();
          console.log(`Created word stack for ${topicName} level ${level} (${difficulty}) with ${words.length} words`);
        } catch (error) {
          console.error(`Error creating word stack for ${topicName} level ${level} (${difficulty}):`, error);
        }
      }
    }
    
    console.log('\nFinished populating word stacks');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Add the rest of the topic to the topicWords object
Object.assign(topicWords, {
  'History and Heritage': {
    beginner: [
      { word: 'עבר', translation: 'Past', examples: ['We learn from the past.'] },
      { word: 'היסטוריה', translation: 'History', examples: ['History tells us about ancient times.'] },
      { word: 'מנהג', translation: 'Tradition', examples: ['Lighting candles is a Jewish tradition.'] },
      { word: 'מוזיאון', translation: 'Museum', examples: ['We visited the history museum.'] },
      { word: 'מורשת', translation: 'Heritage', examples: ['We are proud of our heritage.'] }
    ],
    intermediate: [
      { word: 'תקופה', translation: 'Era', examples: ['The medieval era had many castles.'] },
      { word: 'מסורת', translation: 'Custom', examples: ['Each community has its own customs.'] },
      { word: 'ארכיאולוגיה', translation: 'Archaeology', examples: ['Archaeology helps us understand ancient cultures.'] },
      { word: 'קשר', translation: 'Connection', examples: ['There is a strong connection to the land.'] },
      { word: 'אתר עתיקות', translation: 'Historical Site', examples: ['We toured a historical site in Jerusalem.'] }
    ],
    advanced: [
      { word: 'שימור', translation: 'Preservation', examples: ['Preservation of heritage is important for identity.'] },
      { word: 'חפירה ארכיאולוגית', translation: 'Excavation', examples: ['The excavation revealed ancient tools.'] },
      { word: 'הקשר תרבותי', translation: 'Cultural Context', examples: ['Every tradition has a cultural context.'] },
      { word: 'נרטיב היסטורי', translation: 'Historical Narrative', examples: ['The historical narrative varies between groups.'] },
      { word: 'המשכיות', translation: 'Continuity', examples: ['Cultural continuity strengthens national identity.'] }
    ]
  },
  'Diplomacy and International Relations': {
    beginner: [
      { word: 'שלום', translation: 'Peace', examples: ['We hope for peace between countries.'] },
      { word: 'שגריר', translation: 'Ambassador', examples: ['The ambassador visited our school.'] },
      { word: 'מדינה', translation: 'Country', examples: ['My country is small but beautiful.'] },
      { word: 'שיחה', translation: 'Talk', examples: ['The leaders had a peace talk.'] },
      { word: 'יחסים', translation: 'Relations', examples: ['We have good relations with our neighbors.'] }
    ],
    intermediate: [
      { word: 'הסכם', translation: 'Agreement', examples: ['The agreement helped end the conflict.'] },
      { word: 'דיון', translation: 'Discussion', examples: ['The discussion focused on cooperation.'] },
      { word: 'משא ומתן', translation: 'Negotiation', examples: ['The negotiation lasted for hours.'] },
      { word: 'נציגות', translation: 'Delegation', examples: ['The delegation represented their country.'] },
      { word: 'ארגון בינלאומי', translation: 'International Organization', examples: ['The UN is an international organization.'] }
    ],
    advanced: [
      { word: 'יחסים דיפלומטיים', translation: 'Diplomatic Relations', examples: ['Diplomatic relations were restored after years.'] },
      { word: 'אמנה', translation: 'Treaty', examples: ['The treaty was signed in Geneva.'] },
      { word: 'בוררות', translation: 'Arbitration', examples: ['The countries agreed to arbitration.'] },
      { word: 'ברית', translation: 'Alliance', examples: ['They formed an alliance for mutual defense.'] },
      { word: 'גישה מדינית', translation: 'Diplomatic Approach', examples: ['A diplomatic approach can prevent war.'] }
    ]
  }
});

// Add more topic in chunks to avoid making the file too long
Object.assign(topicWords, {
  'Iron Swords War': {
    beginner: [
      { word: 'חייל', translation: 'Soldier', examples: ['The soldier protected the civilians.'] },
      { word: 'מלחמה', translation: 'War', examples: ['The war began in October.'] },
      { word: 'רקטה', translation: 'Rocket', examples: ['A rocket hit the city.'] },
      { word: 'מקלט', translation: 'Shelter', examples: ['We ran to the shelter.'] },
      { word: 'הגנה', translation: 'Defense', examples: ['Iron Dome is part of our defense.'] }
    ],
    intermediate: [
      { word: 'גיוס', translation: 'Enlistment', examples: ['He got a notice for enlistment.'] },
      { word: 'חזית', translation: 'Frontline', examples: ['He fought on the southern frontline.'] },
      { word: 'מערכה', translation: 'Campaign', examples: ['The military campaign lasted several weeks.'] },
      { word: 'שירות מילואים', translation: 'Reserve Duty', examples: ['He was called to reserve duty.'] },
      { word: 'נפגעים', translation: 'Casualties', examples: ['The war resulted in many casualties.'] }
    ],
    advanced: [
      { word: 'לוחמה מתקדמת', translation: 'Advanced Warfare', examples: ['The army used advanced warfare tactics.'] },
      { word: 'איומים אסטרטגיים', translation: 'Strategic Threats', examples: ['They responded to strategic threats.'] },
      { word: 'ריבונות', translation: 'Sovereignty', examples: ['The conflict touched issues of sovereignty.'] },
      { word: 'הרתעה', translation: 'Deterrence', examples: ['Deterrence is key to preventing escalation.'] },
      { word: 'אמצעים טכנולוגיים', translation: 'Technological Means', examples: ['The military used technological means.'] }
    ]
  },
  'Innovation and Technology': {
    beginner: [
      { word: 'מחשב', translation: 'Computer', examples: ['I use a computer at school.'] },
      { word: 'טלפון', translation: 'Phone', examples: ['My phone is very smart.'] },
      { word: 'רובוט', translation: 'Robot', examples: ['The robot can walk and talk.'] },
      { word: 'המצאה', translation: 'Invention', examples: ['The lightbulb is a great invention.'] },
      { word: 'טכנולוגיה', translation: 'Technology', examples: ['Technology makes life easier.'] }
    ],
    intermediate: [
      { word: 'חדשנות', translation: 'Innovation', examples: ['Innovation drives the economy forward.'] },
      { word: 'אפליקציה', translation: 'Application', examples: ['This application helps you learn.'] },
      { word: 'קוד', translation: 'Code', examples: ['I can write computer code.'] },
      { word: 'סטארטאפ', translation: 'Startup', examples: ['He works at a startup.'] },
      { word: 'פיתוח', translation: 'Development', examples: ['They focus on product development.'] }
    ],
    advanced: [
      { word: 'בינה מלאכותית', translation: 'Artificial Intelligence', examples: ['Artificial intelligence is changing the world.'] },
      { word: 'מציאות מדומה', translation: 'Virtual Reality', examples: ['Virtual reality can simulate real-life experiences.'] },
      { word: 'פריצת דרך', translation: 'Breakthrough', examples: ['The scientist made a medical breakthrough.'] },
      { word: 'קניין רוחני', translation: 'Intellectual Property', examples: ['They protected their intellectual property.'] },
      { word: 'אלגוריתם', translation: 'Algorithm', examples: ['The algorithm improves search results.'] }
    ]
  }
});

// Add the remaining topic
Object.assign(topicWords, {
  'Society and Multiculturalism': {
    beginner: [
      { word: 'משפחה', translation: 'Family', examples: ['My family is big and warm.'] },
      { word: 'קהילה', translation: 'Community', examples: ['Our community helps each other.'] },
      { word: 'שפה', translation: 'Language', examples: ['Hebrew is my first language.'] },
      { word: 'עם', translation: 'Nation', examples: ['Israel is a nation of many cultures.'] },
      { word: 'שוני', translation: 'Difference', examples: ['We respect our differences.'] }
    ],
    intermediate: [
      { word: 'תרבות', translation: 'Culture', examples: ['We celebrate many cultures.'] },
      { word: 'שוויון', translation: 'Equality', examples: ['We believe in equality for all.'] },
      { word: 'שילוב', translation: 'Integration', examples: ['Integration strengthens society.'] },
      { word: 'קבלת האחר', translation: 'Acceptance of Others', examples: ['Acceptance of others brings peace.'] },
      { word: 'רב תרבותיות', translation: 'Multiculturalism', examples: ['Multiculturalism enriches our lives.'] }
    ],
    advanced: [
      { word: 'סובלנות', translation: 'Tolerance', examples: ['Tolerance is key to coexistence.'] },
      { word: 'פערים חברתיים', translation: 'Social Gaps', examples: ['Social gaps lead to inequality.'] },
      { word: 'ייצוג הולם', translation: 'Proper Representation', examples: ['We demand proper representation.'] },
      { word: 'סטיגמה', translation: 'Stigma', examples: ['We fight against stigma and prejudice.'] },
      { word: 'שיח בין-תרבותי', translation: 'Intercultural Dialogue', examples: ['Intercultural dialogue promotes understanding.'] }
    ]
  },
  'Environment and Sustainability': {
    beginner: [
      { word: 'מים', translation: 'Water', examples: ['We drink clean water.'] },
      { word: 'עץ', translation: 'Tree', examples: ['I planted a tree.'] },
      { word: 'שמש', translation: 'Sun', examples: ['The sun gives us energy.'] },
      { word: 'אדמה', translation: 'Earth', examples: ['We grow food in the earth.'] },
      { word: 'טבע', translation: 'Nature', examples: ['Nature is beautiful and important.'] }
    ],
    intermediate: [
      { word: 'מחזור', translation: 'Recycling', examples: ['Recycling helps the environment.'] },
      { word: 'אנרגיה מתחדשת', translation: 'Renewable Energy', examples: ['Solar power is renewable energy.'] },
      { word: 'זיהום', translation: 'Pollution', examples: ['Pollution harms animals and people.'] },
      { word: 'אקלים', translation: 'Climate', examples: ['The climate is changing fast.'] },
      { word: 'קיימות', translation: 'Sustainability', examples: ['Sustainability means thinking about the future.'] }
    ],
    advanced: [
      { word: 'התחממות גלובלית', translation: 'Global Warming', examples: ['Global warming is a major concern.'] },
      { word: 'טביעת פחמן', translation: 'Carbon Footprint', examples: ['We should reduce our carbon footprint.'] },
      { word: 'חקלאות אורגנית', translation: 'Organic Farming', examples: ['Organic farming is healthier for the planet.'] },
      { word: 'משבר סביבתי', translation: 'Environmental Crisis', examples: ['We are facing an environmental crisis.'] },
      { word: 'שמירה על המגוון הביולוגי', translation: 'Biodiversity Preservation', examples: ['Biodiversity preservation protects ecosystems.'] }
    ]
  },
  'Economy and Entrepreneurship': {
    beginner: [
      { word: 'כסף', translation: 'Money', examples: ['I save my money in a bank.'] },
      { word: 'עבודה', translation: 'Job', examples: ['My mom has a job.'] },
      { word: 'מכירה', translation: 'Sale', examples: ['There is a sale at the store.'] },
      { word: 'חנות', translation: 'Shop', examples: ['I bought it at the shop.'] },
      { word: 'מוצר', translation: 'Product', examples: ['This is a good product.'] }
    ],
    intermediate: [
      { word: 'כלכלה', translation: 'Economy', examples: ['The economy is growing.'] },
      { word: 'עסק', translation: 'Business', examples: ['They started a family business.'] },
      { word: 'השקעה', translation: 'Investment', examples: ['He made a smart investment.'] },
      { word: 'יזמות', translation: 'Entrepreneurship', examples: ['Entrepreneurship drives innovation.'] },
      { word: 'שוק', translation: 'Market', examples: ['The market changes every day.'] }
    ],
    advanced: [
      { word: 'תכנית עסקית', translation: 'Business Plan', examples: ['A strong business plan is essential.'] },
      { word: 'הון סיכון', translation: 'Venture Capital', examples: ['Startups seek venture capital.'] },
      { word: 'אסטרטגיה שיווקית', translation: 'Marketing Strategy', examples: ['The marketing strategy increased sales.'] },
      { word: 'תזרים מזומנים', translation: 'Cash Flow', examples: ['Positive cash flow is key.'] },
      { word: 'חדשנות כלכלית', translation: 'Economic Innovation', examples: ['Economic innovation opens new opportunities.'] }
    ]
  }
});

populateWordStacks(); 