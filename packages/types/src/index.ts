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
