// apps/api/src/data/topicWords.ts

export interface WordData {
  word: string;
  translation: string;
  examples: string[];
}

export interface TopicWordData {
  beginner: WordData[];
  intermediate: WordData[];
  advanced: WordData[];
}

export const topicWords: Record<string, TopicWordData> = {
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
  }
};

// Helper function to get words for a topic and difficulty level
export function getTopicWords(topic: string, difficultyLevel: 'beginner' | 'intermediate' | 'advanced'): WordData[] {
  const topicData = topicWords[topic];
  if (!topicData) {
    return [];
  }
  return topicData[difficultyLevel] || [];
} 