// apps/api/src/models/UserProgress.ts
import mongoose from 'mongoose';
import { 
  ITaskProgress, 
  ILevelProgress, 
  ITopicProgress, 
  UserProgress as UserProgressType,
  calculateUserProgress,
  EnglishLevel 
} from '@unity-voice/types';

// הגדר אינטרפייס מלא למודל
export interface IUserProgress extends UserProgressType, mongoose.Document {
  // כל השדות מהטיפוס הקיים 
  // + מתודות מיוחדות של Mongoose Document
  updateProgress(): this;
  addTaskProgress(
    topicId: string | number, 
    levelId: string | number, 
    taskProgress: ITaskProgress
  ): this;
}

// סכמת משימה
const taskProgressSchema = new mongoose.Schema<ITaskProgress>({
  taskId: { 
    type: String, 
    required: true 
  },
  score: { 
    type: Number, 
    default: 0 
  },
  completedAt: { 
    type: Date 
  }
}, { _id: false });

// סכמת רמה
const levelProgressSchema = new mongoose.Schema<ILevelProgress>({
  levelId: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  tasks: [taskProgressSchema],
  earnedScore: { 
    type: Number, 
    default: 0 
  },
  completedAt: { 
    type: Date 
  }
}, { _id: false });

// סכמת נושא
const topicProgressSchema = new mongoose.Schema<ITopicProgress>({
  topicId: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  levels: [levelProgressSchema],
  earnedScore: { 
    type: Number, 
    default: 0 
  }
}, { _id: false });

// סכמת התקדמות משתמש
const userProgressSchema = new mongoose.Schema<IUserProgress>({
  userId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  topics: [topicProgressSchema],
  totalPoints: { 
    type: Number, 
    default: 0 
  },
  englishLevel: { 
    type: String, 
    enum: Object.values(EnglishLevel) 
  },
  lastActivityDate: { 
    type: Date, 
    default: Date.now 
  },
  wordsLearned: [{
    word: { 
      type: String, 
      required: true 
    },
    topicId: { 
      type: mongoose.Schema.Types.Mixed, 
      required: true 
    },
    learnedAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, { 
  timestamps: true 
});

// מתודות סטטיות
userProgressSchema.methods.updateProgress = function() {
  const progressData = calculateUserProgress(this as UserProgressType);
  
  this.totalPoints = progressData.totalEarnedPoints;
  
  return this;
};

// הוספת מתודה לעדכון נקודות וניהול התקדמות
userProgressSchema.methods.addTaskProgress = function(
  topicId: string | number, 
  levelId: string | number, 
  taskProgress: ITaskProgress
) {
  // מצא או צור נושא
  let topicProgress = this.topics.find((t: ITopicProgress) => t.topicId === topicId);
  if (!topicProgress) {
    topicProgress = { 
      topicId, 
      levels: [], 
      earnedScore: 0 
    };
    this.topics.push(topicProgress);
  }

  // מצא או צור רמה
  let levelProgress = topicProgress.levels.find((l: ILevelProgress) => l.levelId === levelId);
  if (!levelProgress) {
    levelProgress = { 
      levelId, 
      tasks: [], 
      earnedScore: 0 
    };
    topicProgress.levels.push(levelProgress);
  }

  // הוסף משימה
  levelProgress.tasks.push(taskProgress);
  
  // עדכן ניקוד
  levelProgress.earnedScore += taskProgress.score;
  topicProgress.earnedScore += taskProgress.score;

  // עדכן תאריך השלמה אם נדרש
  if (taskProgress.completedAt) {
    const allTasksCompleted = levelProgress.tasks.every((t: ITaskProgress) => t.completedAt);
    if (allTasksCompleted) {
      levelProgress.completedAt = new Date();
    }
  }

  // עדכן סך הכל
  this.updateProgress();

  return this;
};

// יצירת המודל
const UserProgress = mongoose.model<IUserProgress>('UserProgress', userProgressSchema);

export default UserProgress;