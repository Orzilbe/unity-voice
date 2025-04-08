// apps/web/src/app/topics/tasks/flashcard/Refactored.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { FaVolumeUp } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Flashcard {
  id: number;
  word: string;
  translation: string;
  example: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface RefactoredFlashcardsProps {
  topic: string;
  pageTitle: string;
  initialDifficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export default function RefactoredFlashcards({ 
  topic, 
  pageTitle, 
  initialDifficulty = 'beginner' 
}: RefactoredFlashcardsProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [knownWords, setKnownWords] = useState<number[]>([]);
  const [showKnownWordsModal, setShowKnownWordsModal] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'normal' | 'slow'>('normal');
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // מילים לדוגמה שישמשו כברירת מחדל אם הפעלת ה-API נכשלת
  const defaultFlashcards: Record<string, Flashcard[]> = {
    'security': [
      { id: 1, word: 'Password', translation: 'סיסמה', example: 'Make sure to use a strong password for all your accounts.', difficulty: 'beginner' },
      { id: 2, word: 'Firewall', translation: 'חומת אש', example: 'The company installed a new firewall to protect their network.', difficulty: 'beginner' },
      { id: 3, word: 'Encryption', translation: 'הצפנה', example: 'End-to-end encryption keeps your messages secure.', difficulty: 'beginner' },
      { id: 4, word: 'Authentication', translation: 'אימות', example: 'Two-factor authentication adds an extra layer of security.', difficulty: 'beginner' },
      { id: 5, word: 'Malware', translation: 'תוכנה זדונית', example: 'Always scan email attachments for malware before opening them.', difficulty: 'beginner' },
    ],
    'innovation': [
      { id: 1, word: 'Breakthrough', translation: 'פריצת דרך', example: 'The new invention represents a breakthrough in medical science.', difficulty: 'beginner' },
      { id: 2, word: 'Prototype', translation: 'אב טיפוס', example: 'They developed a working prototype of their new device.', difficulty: 'beginner' },
      { id: 3, word: 'Disruption', translation: 'שיבוש', example: 'This technology caused major disruption in the industry.', difficulty: 'beginner' },
      { id: 4, word: 'Venture', translation: 'מיזם', example: 'They launched a new venture focused on renewable energy.', difficulty: 'beginner' },
      { id: 5, word: 'Pioneer', translation: 'חלוץ', example: 'She was a pioneer in the field of artificial intelligence.', difficulty: 'beginner' },
    ],
    'history-and-heritage': [
      { id: 1, word: 'Legacy', translation: 'מורשת', example: 'He left behind a lasting legacy of scientific achievements.', difficulty: 'beginner' },
      { id: 2, word: 'Artifact', translation: 'ממצא', example: 'The museum displayed ancient artifacts from the excavation.', difficulty: 'beginner' },
      { id: 3, word: 'Heritage', translation: 'מסורת', example: 'They celebrate their cultural heritage through traditional festivals.', difficulty: 'beginner' },
      { id: 4, word: 'Preservation', translation: 'שימור', example: 'Historical preservation ensures these buildings will be enjoyed by future generations.', difficulty: 'beginner' },
      { id: 5, word: 'Dynasty', translation: 'שושלת', example: 'The Ming Dynasty ruled China for nearly 300 years.', difficulty: 'beginner' },
    ],
    'general': [
      { id: 1, word: 'Example', translation: 'דוגמה', example: 'This is an example word.', difficulty: 'beginner' },
      { id: 2, word: 'Practice', translation: 'תרגול', example: 'Practice makes perfect when learning a new language.', difficulty: 'beginner' },
      { id: 3, word: 'Vocabulary', translation: 'אוצר מילים', example: 'Building your vocabulary takes time and effort.', difficulty: 'beginner' },
      { id: 4, word: 'Learning', translation: 'למידה', example: 'Learning new skills is important for personal growth.', difficulty: 'beginner' },
      { id: 5, word: 'Progress', translation: 'התקדמות', example: "You've made good progress in your studies.", difficulty: 'beginner' },
    ]
  };

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<Flashcard[]>([]);

  const router = useRouter();

  const userProfile = {
    fullName: "John Doe",
    email: "johndoe@example.com",
    phoneNumber: "123-456-7890",
    birthDate: "1990-01-01",
    englishLevel: "Intermediate",
  };

  // טעינת מילים מ-localStorage או מברירת המחדל
  useEffect(() => {
    const loadFlashcards = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // ניסיון לטעון מילים מה-localStorage
        const savedCards = localStorage.getItem(`flashcards_${topic}`);
        
        if (savedCards) {
          // יש מילים שמורות - נשתמש בהן
          const parsedCards = JSON.parse(savedCards);
          setFlashcards(parsedCards);
          setFilteredFlashcards(parsedCards.filter((card: Flashcard) => 
            !JSON.parse(localStorage.getItem(`known_words_${topic}`) || '[]').includes(card.id)
          ));
          
          // טעינת מילים ידועות
          const savedKnownWords = localStorage.getItem(`known_words_${topic}`);
          if (savedKnownWords) {
            setKnownWords(JSON.parse(savedKnownWords));
          }
        } else {
          // אין מילים שמורות - נשתמש בברירת מחדל או ננסה API
          await generateNewWords();
        }
      } catch (error) {
        console.error('Error loading flashcards:', error);
        setError('שגיאה בטעינת המילים');
        
        // במקרה של שגיאה, נשתמש במילים המוגדרות מראש
        useDefaultFlashcards();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFlashcards();
  }, [topic]);
  
  // שמירת מילים ידועות כאשר הן משתנות
  useEffect(() => {
    if (knownWords.length > 0) {
      localStorage.setItem(`known_words_${topic}`, JSON.stringify(knownWords));
    }
  }, [knownWords, topic]);

  // פונקציה לקבלת מילים מברירת המחדל
  const useDefaultFlashcards = () => {
    // בחירת קבוצת המילים המתאימה לנושא, או מילים כלליות אם אין התאמה
    const topicFlashcards = defaultFlashcards[topic] || defaultFlashcards['general'];
    setFlashcards(topicFlashcards);
    setFilteredFlashcards(topicFlashcards);
  };

  // פונקציה חדשה לקבלת מילים מדומות
  const getSimulatedWords = async (topicName: string, difficultyLevel: string): Promise<Flashcard[]> => {
    // יצירת ID רנדומליים גדולים למניעת התנגשויות
    const generateRandomId = () => Math.floor(Math.random() * 90000) + 10000;
    
    // מקור מילים בסיסי לפי נושא
    const basicWords: Record<string, { word: string; translation: string; example: string }[]> = {
      'security': [
        { word: 'Vulnerability', translation: 'פגיעות', example: 'The system had a vulnerability that hackers exploited.' },
        { word: 'Breach', translation: 'פריצה', example: 'The company reported a data breach affecting thousands of users.' },
        { word: 'Phishing', translation: 'דיוג', example: 'Be careful of phishing emails that try to steal your password.' },
        { word: 'Ransomware', translation: 'כופרה', example: 'The ransomware attack encrypted all their files.' },
        { word: 'Biometric', translation: 'ביומטרי', example: 'Biometric authentication uses fingerprints or facial recognition.' }
      ],
      'innovation': [
        { word: 'Innovative', translation: 'חדשני', example: 'Their innovative approach changed the industry.' },
        { word: 'Disruptive', translation: 'משבש', example: 'Disruptive technologies often replace older methods completely.' },
        { word: 'Revolutionize', translation: 'מהפכני', example: 'The internet revolutionized how we communicate.' },
        { word: 'Cutting-edge', translation: 'חדשני ביותר', example: 'Their research uses cutting-edge technology.' },
        { word: 'Paradigm shift', translation: 'שינוי פרדיגמה', example: 'The discovery caused a paradigm shift in scientific thinking.' }
      ],
      'history-and-heritage': [
        { word: 'Ancient', translation: 'עתיק', example: 'They discovered ancient artifacts from a lost civilization.' },
        { word: 'Ancestry', translation: 'אבות אבותיו', example: 'Many people trace their ancestry through DNA testing.' },
        { word: 'Monument', translation: 'אנדרטה', example: 'The monument commemorates heroes from the war.' },
        { word: 'Archaeology', translation: 'ארכיאולוגיה', example: 'Archaeology helps us understand past cultures.' },
        { word: 'Relic', translation: 'שריד', example: 'The museum houses religious relics from the medieval period.' }
      ],
      'general': [
        { word: 'Comprehensive', translation: 'מקיף', example: 'We need a comprehensive solution to this problem.' },
        { word: 'Significant', translation: 'משמעותי', example: 'There has been significant progress in the research.' },
        { word: 'Perspective', translation: 'נקודת מבט', example: 'Looking at the issue from a different perspective helps.' },
        { word: 'Fundamental', translation: 'יסודי', example: 'These are the fundamental principles of the system.' },
        { word: 'Elaborate', translation: 'מפורט', example: 'Could you elaborate on your proposal?' }
      ]
    };
    
    // מילים נוספות לפי רמת קושי
    const advancedWords: Record<string, { word: string; translation: string; example: string }[]> = {
      'security': [
        { word: 'Zero-day exploit', translation: 'ניצול אפס-יום', example: 'The zero-day exploit affected systems before a patch was available.' },
        { word: 'Cryptography', translation: 'קריפטוגרפיה', example: 'Modern cryptography relies on complex mathematical algorithms.' },
        { word: 'Penetration testing', translation: 'בדיקת חדירות', example: 'They hired a firm to conduct penetration testing on their network.' },
        { word: 'Man-in-the-middle', translation: 'איש באמצע', example: 'A man-in-the-middle attack intercepts communication between two parties.' },
        { word: 'Social engineering', translation: 'הנדסה חברתית', example: 'Social engineering tricks people into revealing confidential information.' }
      ],
      'innovation': [
        { word: 'Avant-garde', translation: 'חלוצי', example: 'The avant-garde design challenged conventional thinking.' },
        { word: 'Visionary', translation: 'בעל חזון', example: 'She is a visionary leader who anticipated market trends.' },
        { word: 'Groundbreaking', translation: 'פורץ דרך', example: 'Their groundbreaking research changed scientific understanding.' },
        { word: 'Unconventional', translation: 'לא קונבנציונלי', example: 'Their unconventional approach solved the problem in a new way.' },
        { word: 'Transformative', translation: 'משנה מציאות', example: 'AI has a transformative impact on various industries.' }
      ]
    };
    
    // בחירת קבוצת מילים לפי נושא ורמת קושי
    let wordSource = basicWords[topicName] || basicWords['general'];
    
    // שימוש במילים מתקדמות יותר אם הרמה מתאימה ויש מילים זמינות
    if ((difficultyLevel === 'intermediate' || difficultyLevel === 'advanced') && 
        advancedWords[topicName]) {
      wordSource = advancedWords[topicName];
    }
    
    // למקרה שאין מספיק מילים, נוסיף כמה מילים אקראיות
    if (wordSource.length < 5) {
      const additionalWords = [
        { word: 'Random Word ' + Math.floor(Math.random() * 1000), translation: 'מילה אקראית', example: 'This is a random example sentence.' },
        { word: 'Extra Term ' + Math.floor(Math.random() * 1000), translation: 'מונח נוסף', example: 'Here is another example sentence for variety.' }
      ];
      wordSource = [...wordSource, ...additionalWords];
    }
    
    // הוספת צפיליות לרמות קושי שונות
    const getWordPrefix = (level: string, index: number) => {
      const time = new Date().getTime(); // להבטיח שהמילה משתנה בכל פעם
      const shortTime = Math.floor((time % 10000) / 100); // מספר קצר יותר לשמות יותר ברורים
      
      if (level === 'advanced') {
        return `Adv${shortTime}-${index+1}: `;
      } else if (level === 'intermediate') {
        return `Int${shortTime}-${index+1}: `;
      }
      return `${shortTime}-${index+1}: `;
    };
    
    // יצירת מילים חדשות עם מזהים ייחודיים
    return wordSource.map((item, index) => ({
      id: generateRandomId(),
      word: getWordPrefix(difficultyLevel, index) + item.word,
      translation: item.translation,
      example: item.example,
      difficulty: difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
    }));
  };

  // פונקציה ליצירת מילים חדשות - גרסה משופרת
  const generateNewWords = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // ניסיון לקרוא ל-API אמיתי
      const apiUrls = [
        '/api/flashcards',
        '/api/generate-flashcards',
        '/api/generate-flashcards/route'
      ];
      
      let apiSuccess = false;
      let responseData = null;
      
      // ניסיון לכל אחד מנתיבי ה-API האפשריים
      for (const url of apiUrls) {
        try {
          console.log(`Trying API endpoint: ${url}`);
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic,
              difficulty: initialDifficulty,
              existingWords: flashcards.map(card => card.word),
            }),
          });
          
          if (response.ok) {
            responseData = await response.json();
            apiSuccess = true;
            console.log(`API call successful at: ${url}`);
            break;
          }
        } catch (e) {
          console.log(`API attempt failed at ${url}:`, e);
          // המשך לנתיב הבא
        }
      }
      
      // אם כל קריאות ה-API נכשלו, השתמש בסימולציה מקומית
      if (!apiSuccess) {
        console.log('All API attempts failed, using local simulation');
        const simulatedWords = await getSimulatedWords(topic, initialDifficulty);
        responseData = { words: simulatedWords };
      }
      
      if (!responseData?.words || responseData.words.length === 0) {
        throw new Error('לא התקבלו מילים מהשרת');
      }
      
      // הוספת מזהה ייחודי לכל מילה אם צריך
      const newWords = responseData.words.map((word: Flashcard, index: number) => ({
        ...word,
        id: word.id ?? Math.floor(Math.random() * 90000) + 10000, // שימוש במזהה אקראי אם אין
      }));
      
      console.log('New words generated:', newWords);
      
      // אם יש כבר מילים, הוסף את החדשות, אחרת השתמש רק בחדשות
      const updatedFlashcards = flashcards.length > 0 
        ? [...flashcards, ...newWords] 
        : newWords;
      
      setFlashcards(updatedFlashcards);
      
      // פילטור המילים הידועות לפני עדכון filteredFlashcards
      const filteredUpdated = updatedFlashcards.filter((card: Flashcard) => !knownWords.includes(card.id));
      console.log('Updated filtered flashcards:', filteredUpdated);
      
      setFilteredFlashcards(filteredUpdated);
      
      // שמירה ב-localStorage
      localStorage.setItem(`flashcards_${topic}`, JSON.stringify(updatedFlashcards));
      
      return newWords;
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setError('שגיאה ביצירת מילים חדשות');
      
      // אם זו הפעם הראשונה ואין מילים, השתמש בברירת המחדל
      if (flashcards.length === 0) {
        useDefaultFlashcards();
      }
      
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentCard < filteredFlashcards.length - 1) {
      setCurrentCard((prev) => prev + 1);
      setShowTranslation(false);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard((prev) => prev - 1);
      setShowTranslation(false);
    }
  };

  const markAsKnown = () => {
    const currentId = filteredFlashcards[currentCard]?.id;
    if (currentId !== undefined && !knownWords.includes(currentId)) {
      setKnownWords((prev) => [...prev, currentId]);
      
      // אם המילה האחרונה הוסרה, וזה המקרה הבודד, currentCard יהיה 0
      // ולא צריך לשנות אותו
      const tempFiltered = filteredFlashcards.filter((card) => card.id !== currentId);
      
      // שמירת המדד הנוכחי או חזרה למדד קודם אם המילה הנוכחית הוסרה
      const newCurrentCard = 
        currentCard >= tempFiltered.length ? 
        Math.max(0, tempFiltered.length - 1) : 
        currentCard;

      setFilteredFlashcards(tempFiltered);
      setCurrentCard(newCurrentCard);
      setShowTranslation(false);
    }
  };

  const unmarkAsKnown = (wordId: number) => {
    const wordToRemove = flashcards.find((card) => card.id === wordId);
    if (!wordToRemove) return;

    setKnownWords((prev) => prev.filter((id) => id !== wordId));
    
    // הוספת המילה חזרה לרשימה המסוננת ומיון לפי ID
    const updatedFiltered = [...filteredFlashcards, wordToRemove].sort((a, b) => a.id - b.id);
    setFilteredFlashcards(updatedFiltered);
  };

  const handlePlayPronunciation = () => {
    const word = filteredFlashcards[currentCard]?.word;
    if (!word) return;

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = playbackSpeed === 'slow' ? 0.7 : 1;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const toggleProfile = () => setShowProfile(!showProfile);

  const resetLearning = () => {
    // שחזור כל המילים מהרשימה השמורה
    const allWords = [...flashcards];
    
    setFilteredFlashcards(allWords);
    setKnownWords([]);
    setCurrentCard(0);
    setShowTranslation(false);
    localStorage.removeItem(`known_words_${topic}`);
  };

  // אם יש טעינה, הצג ספינר
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-700">טוען מילים...</p>
        </div>
      </div>
    );
  }
  
  // אם יש שגיאה ואין מילים, הצג הודעת שגיאה
  if (error && filteredFlashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6">לא ניתן לטעון את המילים כרגע. נסה שוב מאוחר יותר.</p>
          <button
            onClick={generateNewWords}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  // התצוגה הרגילה
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 relative">
      {/* Add Google Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

      {/* כותרת העמוד */}
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 mt-2">{pageTitle}</h1>

      {/* User Profile Icon */}
      <div className="absolute top-4 right-4">
        <div 
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          onClick={toggleProfile}
        >
          <span className="text-2xl">👤</span>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="absolute top-20 right-4 bg-white p-6 shadow-2xl rounded-2xl w-80 z-50 border border-gray-100 transform transition-all duration-300">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Profile</h2>
          <div className="space-y-3">
            <p className="flex items-center text-gray-700"><strong className="min-w-24">Name:</strong> {userProfile.fullName}</p>
            <p className="flex items-center text-gray-700"><strong className="min-w-24">Email:</strong> {userProfile.email}</p>
            <p className="flex items-center text-gray-700"><strong className="min-w-24">Phone:</strong> {userProfile.phoneNumber}</p>
            <p className="flex items-center text-gray-700"><strong className="min-w-24">Birth Date:</strong> {userProfile.birthDate}</p>
            <p className="flex items-center text-gray-700"><strong className="min-w-24">English Level:</strong> 
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm ml-2">
                {userProfile.englishLevel}
              </span>
            </p>
          </div>
          <div className="mt-6 space-y-2">
            <button
              className="w-full py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              onClick={() => alert('Logout Successful!')}
            >
              Logout
            </button>
            <button
              className="w-full py-2.5 bg-gray-400 text-white rounded-xl hover:bg-gray-500 transition-colors"
              onClick={toggleProfile}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto mt-4">
        {filteredFlashcards.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-500">
                Card {currentCard + 1} of {filteredFlashcards.length}
              </span>
              <span className="text-sm font-medium text-gray-500">
                Learned: {knownWords.length} of {knownWords.length + filteredFlashcards.length}
              </span>
            </div>

            <div
              className="relative h-72 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl flex flex-col justify-center items-center mb-8 cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-md"
              onClick={() => setShowTranslation(!showTranslation)}
            >
              <h2 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent text-center px-4">
                {showTranslation
                  ? filteredFlashcards[currentCard]?.translation
                  : filteredFlashcards[currentCard]?.word}
              </h2>
              {!showTranslation && (
                <p className="text-gray-600 text-xl italic mt-6 px-12 text-center">
                  {filteredFlashcards[currentCard]?.example}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center gap-6 mb-8">
              <button
                onClick={handlePrevious}
                className="px-8 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none"
                disabled={currentCard === 0}
              >
                Previous
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePlayPronunciation}
                  className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 hover:bg-orange-200 transition-colors"
                  title="Play pronunciation"
                >
                  {React.createElement(FaVolumeUp, { size: 24 })}
                </button>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(e.target.value as 'normal' | 'slow')}
                  className="border-2 border-orange-200 text-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-400"
                >
                  <option value="normal">Normal Speed</option>
                  <option value="slow">Slow Speed</option>
                </select>
              </div>
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none"
                disabled={currentCard === filteredFlashcards.length - 1}
              >
                Next
              </button>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={markAsKnown}
                className="px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg"
              >
                I Know This Word ✨
              </button>
              <button
                onClick={() => setShowKnownWordsModal(true)}
                className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg"
              >
                View Known Words 📚
              </button>
            </div>
            
            {/* כפתורים נוספים */}
            <div className="flex justify-center mt-6 gap-4">
              <button
                onClick={generateNewWords}
                className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all transform hover:-translate-y-1 text-sm"
              >
                Generate New Words 🪄
              </button>
              <button
                onClick={resetLearning}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all transform hover:-translate-y-1 text-sm"
              >
                Reset Progress 🔄
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 Fantastic Job! 🎉</h2>
            <p className="text-gray-700 text-lg mb-8">You've mastered all the flashcards!</p>
            <div className="space-y-4">
              <button
                onClick={() => router.push(`/topics/${topic}/quiz`)}
                className="px-8 py-4 w-full bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg text-lg"
              >
                Start Quiz 🎯
              </button>
              <button
                onClick={resetLearning}
                className="px-8 py-4 w-full bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg text-lg"
              >
                Reset Progress & Learn Again 🔄
              </button>
              <button
                onClick={generateNewWords}
                className="px-8 py-4 w-full bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg text-lg"
              >
                Generate More Words 🪄
              </button>
            </div>
          </div>
        )}
      </main>

      {showKnownWordsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Known Words 🌟</h2>
            {knownWords.length > 0 ? (
              <ul className="space-y-4">
                {knownWords.map((id) => {
                  const word = flashcards.find((card) => card.id === id);
                  return word && (
                    <li key={id} className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                      <span className="font-semibold text-gray-700">{word.word}</span>
                      <button
                        onClick={() => unmarkAsKnown(id)}
                        className="text-red-500 hover:text-red-600 font-medium transition-colors"
                      >
                        Remove ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">No known words yet.</p>
            )}
            <button
              onClick={() => setShowKnownWordsModal(false)}
              className="mt-6 w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="absolute top-4 left-4">
        <Link 
          href="/topics" 
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span className="text-2xl">🏠</span>
        </Link>
      </div>
    </div>
  );
}