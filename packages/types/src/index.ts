// packages/types/src/index.ts
export interface User {
  id?: string;
  username: string;
  email: string;
  createdAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user"
}
// טיפוס לקביעת רמת אנגלית
export enum EnglishLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced"
}

// טיפוס לקביעת קבוצת גיל
export enum AgeRange {
  UNDER_18 = "under18",
  AGE_18_24 = "18-24",
  AGE_25_34 = "25-34",
  AGE_35_44 = "35-44",
  AGE_45_54 = "45-54",
  AGE_55_64 = "55-64",
  AGE_65_PLUS = "65+"
}

// משתמש מלא
export interface User {
  id?: string;            // מזהה ייחודי (נוצר אוטומטית)
  email: string;          // אימייל (חובה וייחודי)
  firstName: string;      // שם פרטי
  lastName: string;       // שם משפחה
  password?: string;      // סיסמה - לא תישלח לקליינט
  phoneNumber?: string;   // מספר טלפון (אופציונלי)
  ageRange: AgeRange;     // טווח גילאים מתוך קבוע
  englishLevel: EnglishLevel; // רמת אנגלית מתוך קבוע
  profilePicture?: string; // נתיב לתמונת פרופיל (אופציונלי)
  score?: number;         // ניקוד המשתמש (אופציונלי)
  createdAt: Date;        // תאריך יצירת המשתמש
  lastLogin?: Date;       // תאריך התחברות אחרון
}

// מודל משתמש ללא הסיסמה - לשליחה לקליינט
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  ageRange: AgeRange;
  englishLevel: EnglishLevel;
  profilePicture?: string;
  score?: number;
  createdAt: Date;
  lastLogin?: Date;
}

// טיפוס למילה
export interface Word {
  id?: string;            // מזהה ייחודי של המילה
  word: string;           // המילה באנגלית
  translation: string;    // תרגום המילה לעברית
  exampleUsage: string;   // דוגמת שימוש במילה
  pronunciation: string;  // איך להגות את המילה (כתיב פונטי או קישור להקלטה)
}
// טיפוסים אפשריים למשימה
export enum TaskType {
  QUIZ = "quiz",
  WORD = "word",
  INTERACTIVE_SESSION = "interactiveSession",
  POST = "post",
  VOCABULARY = "vocabulary",
  LISTENING = "listening",
  SPEAKING = "speaking",
  GRAMMAR = "grammar",
  WRITING = "writing"
}
// טיפוס למשימה
export interface Task {
  id?: string;              // מזהה ייחודי של המשימה
  taskScore: number;        // ניקוד המשימה
  taskType: TaskType;       // סוג המשימה
  completionDate?: Date;    // תאריך סיום (אופציונלי, אם המשימה הושלמה)
  durationTask: number;     // משך זמן המשימה (בדקות)
  userId: string;           // מזהה המשתמש שהמשימה שייכת אליו
  words?: string[];         // מזהים של מילים הקשורות למשימה (אם רלוונטי)
}


export enum SessionType {
  // סוגי שיחות
  PRESS_CONFERENCE = "pressConference",        // מענה לעיתונאים
  DIPLOMATIC_CONVERSATION = "diplomaticConversation", // שיחות דיפלומטיות
  DEBATE_PRESENTATION = "debatePresentation",   // הצגת עמדות בדיונים
  CAMPUS_ADVOCACY = "campusAdvocacy",           // הסברה בקמפוסים
  
  // סוגים אחרים
  PRONUNCIATION = "pronunciation",
  VOCABULARY_PRACTICE = "vocabularyPractice",
  GRAMMAR_PRACTICE = "grammarPractice",
  LISTENING_COMPREHENSION = "listeningComprehension"
}
// טיפוס לסשן אינטראקטיבי
export interface InteractiveSession {
  id?: string;              // מזהה ייחודי של הסשן
  sessionType: SessionType; // סוג הסשן
  userId: string;           // מזהה המשתמש שהסשן שייך אליו
  createdAt: Date;          // זמן יצירת הסשן
  endedAt?: Date;           // זמן סיום הסשן (אופציונלי, אם הסשן הסתיים)
  questions?: string[];     // מערך של מזהי שאלות הקשורות לסשן
}
// טיפוס לשאלה
export interface Question {
  id?: string;          // מזהה ייחודי של השאלה
  questionText: string; // טקסט השאלה
  answerText: string;   // טקסט התשובה
  feedback?: string;    // משוב על התשובה (אופציונלי)
  sessionId?: string;   // מזהה של סשן אינטראקטיבי קשור (אם רלוונטי)
}
// טיפוס לפוסט
export interface Post {
  id?: string;          // מזהה ייחודי של הפוסט
  postContent: string;  // תוכן הפוסט
  picture?: string;     // קישור לתמונה (אופציונלי)
  userId: string;       // מזהה המשתמש שיצר את הפוסט
  createdAt: Date;      // תאריך יצירת הפוסט
  updatedAt?: Date;     // תאריך עדכון הפוסט (אופציונלי)
  comments?: Comment[]; // מערך תגובות לפוסט (אופציונלי)
  taskId?: string;      // מזהה משימה קשורה (אם רלוונטי)
}
// טיפוס לתגובה
export interface Comment {
  id?: string;             // מזהה ייחודי של התגובה
  commentContent: string;  // תוכן התגובה
  feedback?: string;       // משוב על התגובה (אופציונלי)
  userId: string;          // מזהה המשתמש שיצר את התגובה
  postId: string;          // מזהה הפוסט שאליו התגובה שייכת
  createdAt: Date;         // תאריך יצירת התגובה
  updatedAt?: Date;        // תאריך עדכון התגובה (אופציונלי)
}
// סוגי מבחנים אפשריים
export enum TestType {
  PLACEMENT = "placement",        // מבחן רמה ראשוני
  PROGRESS = "progress",          // מבחן התקדמות
  VOCABULARY = "vocabulary",      // מבחן אוצר מילים
  GRAMMAR = "grammar",            // מבחן דקדוק
  COMPREHENSION = "comprehension" // מבחן הבנת הנקרא
}

// טיפוס למבחן
export interface Test {
  id?: string;             // מזהה ייחודי של המבחן
  testScore: number;       // ציון המבחן
  testType: TestType;      // סוג המבחן
  completionDate?: Date;   // תאריך השלמת המבחן
  durationTest: number;    // משך זמן המבחן (בדקות)
  userId: string;          // מזהה המשתמש שביצע את המבחן
  questions?: string[];    // מזהים של שאלות במבחן
}
// טיפוס לנושא (Topic)
export interface Topic {
  id?: string;         // מזהה ייחודי של הנושא
  topicName: string;   // שם הנושא
  icon?: string;       // קישור לאייקון של הנושא
  levels?: Level[];    // רמות הקשורות לנושא
}

// טיפוס לרמה (Level)
export interface Level {
  id?: string;         // מזהה ייחודי של הרמה
  levelScore: number;  // ניקוד הרמה
  topicId: string;     // מזהה הנושא שהרמה שייכת אליו
  tasks?: string[];    // מזהים של משימות ברמה זו
}

// טיפוס לתוצאות המבחן
export interface TestResult {
  id?: string;         // מזהה ייחודי של תוצאת המבחן
  testId: string;      // מזהה המבחן
  userId: string;      // מזהה המשתמש
  score: number;       // ציון
  feedback?: string;   // משוב מפורט על המבחן
  completedAt: Date;   // תאריך השלמה
}

// טיפוס להתקדמות משתמש
export interface UserProgress {
  userId: string;            // מזהה המשתמש
  currentLevel?: string;     // מזהה הרמה הנוכחית
  completedLevels: string[]; // מזהים של רמות שהושלמו
  completedTasks: string[];  // מזהים של משימות שהושלמו
  totalScore: number;        // סך כל הנקודות שנצברו
  lastActive: Date;          // תאריך פעילות אחרונה
}

// טיפוס לסטטיסטיקות משתמש
export interface UserStats {
  userId: string;              // מזהה המשתמש
  wordsLearned: number;        // מספר מילים שנלמדו
  sessionsCompleted: number;   // מספר סשנים שהושלמו
  tasksCompleted: number;      // מספר משימות שהושלמו
  averageScore: number;        // ציון ממוצע
  totalTimeSpent: number;      // סך זמן שבילה במערכת (בדקות)
  lastUpdateDate: Date;        // תאריך עדכון אחרון
}

// טיפוס לתגי הישגים
export interface Achievement {
  id: string;                  // מזהה ייחודי של ההישג
  name: string;                // שם ההישג
  description: string;         // תיאור ההישג
  iconUrl: string;             // קישור לאייקון של ההישג
  requiredScore: number;       // ניקוד נדרש להשגה
  usersAchieved: string[];     // מזהים של משתמשים שהשיגו
}

// מבנה בקשת התחברות
export interface LoginRequest {
  email: string;               // אימייל לצורך התחברות
  password: string;            // סיסמה
}

// מבנה תגובת התחברות
export interface LoginResponse {
  user: UserResponse;          // פרטי המשתמש (ללא סיסמה)
  token: string;               // טוקן JWT לאימות
  expiresAt: Date;             // מועד פקיעת התוקף של הטוקן
}

// מבנה בקשת הרשמה
export interface RegisterRequest {
  email: string;               // אימייל
  firstName: string;           // שם פרטי
  lastName: string;            // שם משפחה
  password: string;            // סיסמה
  phoneNumber?: string;        // מספר טלפון (אופציונלי)
  ageRange: AgeRange;          // טווח גילאים
  englishLevel: EnglishLevel;  // רמת אנגלית
  profilePicture?: string;     // תמונת פרופיל (אופציונלי)
}

// מבנה תשובות API כללי
export interface ApiResponse<T> {
  success: boolean;            // האם הבקשה הצליחה
  data?: T;                    // נתוני תוצאה (אופציונלי)
  error?: string;              // הודעת שגיאה (אופציונלי)
  message?: string;            // הודעה כללית (אופציונלי)
}
