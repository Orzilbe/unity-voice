// apps/api/src/db/migrate.ts

import mongoose from 'mongoose';
import { config } from 'dotenv';
import User from '../models/User';
import Topic from '../models/Topic';
import Word from '../models/Word';
import Task from '../models/Task';
import Post from '../models/Post';
import Comment from '../models/Comment';
import InteractiveSession from '../models/InteractiveSession';
import Question from '../models/Question';
import Test from '../models/Test';
import Level from '../models/Level';
import UserInLevel from '../models/UserInLevel';
import fs from 'fs';
import path from 'path';

config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

// Create a backup directory
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Function to safely access collections
const getCollection = async (collectionName: string) => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }
  return db.collection(collectionName);
};

// Function to back up the database before migration
const backupDatabase = async () => {
  console.log('Creating database backup...');

  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Get all collections
    const collections = await db.listCollections().toArray();
    const backup: Record<string, any[]> = {};

    // Backup each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      if (collectionName.startsWith('system.')) continue;
      
      const data = await db.collection(collectionName).find({}).toArray();
      backup[collectionName] = data;
      console.log(`Backed up ${data.length} documents from ${collectionName}`);
    }

    // Save backup to file with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`Backup saved to ${backupPath}`);
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

// Migration function for Users
const migrateUsers = async () => {
  console.log('Migrating users...');
  
  try {
    const usersCollection = await getCollection('users');
    const users = await usersCollection.find({}).toArray();
    console.log(`Found ${users.length} users to migrate`);
    
    for (const oldUser of users) {
      const newUser = {
        email: oldUser.email,
        firstName: oldUser.firstName,
        lastName: oldUser.lastName,
        password: oldUser.password,
        phoneNumber: oldUser.phoneNumber,
        ageRange: oldUser.ageRange || 'AGE_18_24',
        englishLevel: oldUser.englishLevel || 'BEGINNER',
        profilePicture: oldUser.profilePicture,
        score: oldUser.score || 0,
        createdAt: oldUser.createdAt || new Date(),
        lastLogin: oldUser.lastLogin,
        badge: oldUser.badge ? {
          id: oldUser.badge.id || 0,
          type: oldUser.badge.type || '',
          name: oldUser.badge.name || '',
          description: oldUser.badge.description || '',
          icon: oldUser.badge.icon || '',
          dateEarned: oldUser.badge.dateEarned,
          pointsRequired: oldUser.badge.pointsRequired || 0
        } : undefined,
        role: oldUser.role || 'USER',
        isActive: oldUser.isActive !== undefined ? oldUser.isActive : true,
        level: oldUser.level,
        topic: oldUser.topic || []
      };
      
      await User.findOneAndUpdate(
        { email: newUser.email },
        newUser,
        { upsert: true, new: true }
      );
      
      console.log(`Migrated user: ${newUser.email}`);
    }
  } catch (error) {
    console.error('Error migrating users:', error);
    throw error;
  }
};

// Migration function for Topics
const migrateTopics = async () => {
  console.log('Migrating topic...');
  
  try {
    const topicCollection = await getCollection('topic');
    const topic = await topicCollection.find({}).toArray();
    console.log(`Found ${topic.length} topic to migrate`);
    
    for (const oldTopic of topic) {
      const newTopic = {
        topicName: oldTopic.topicName || oldTopic.en || `topic_${oldTopic._id}`,
        topicHe: oldTopic.topicHe || oldTopic.he || '',
        icon: oldTopic.icon || '📚'
      };
      
      await Topic.findOneAndUpdate(
        { topicName: newTopic.topicName },
        newTopic,
        { upsert: true, new: true }
      );
      
      console.log(`Migrated topic: ${newTopic.topicName}`);
    }
  } catch (error) {
    console.error('Error migrating topic:', error);
    throw error;
  }
};

// Migration function for Words
const migrateWords = async () => {
  console.log('Migrating words...');
  
  try {
    const wordsCollection = await getCollection('words');
    const words = await wordsCollection.find({}).toArray();
    console.log(`Found ${words.length} words to migrate`);
    
    for (const oldWord of words) {
      const newWord = {
        wordId: oldWord._id.toString(),
        word: oldWord.word || '',
        translation: oldWord.translation || '',
        exampleUsage: oldWord.exampleUsage || '',
        pronunciation: oldWord.pronunciation || '',
        taskId: oldWord.taskId
      };
      
      await Word.findOneAndUpdate(
        { wordId: newWord.wordId },
        newWord,
        { upsert: true, new: true }
      );
      
      console.log(`Migrated word: ${newWord.word}`);
    }
  } catch (error) {
    console.error('Error migrating words:', error);
    throw error;
  }
};

// Migration function for Tasks
const migrateTasks = async () => {
  console.log('Migrating tasks...');
  
  try {
    const tasksCollection = await getCollection('tasks');
    const tasks = await tasksCollection.find({}).toArray();
    console.log(`Found ${tasks.length} tasks to migrate`);
    
    for (const oldTask of tasks) {
      const user = await User.findById(oldTask.userId);
      if (!user) {
        console.log(`User not found for task: ${oldTask._id}`);
        continue;
      }
      
      const newTask = {
        taskId: oldTask._id.toString(),
        taskScore: oldTask.taskScore || 0,
        taskType: oldTask.taskType || 'QUIZ',
        completionDate: oldTask.completionDate || new Date(),
        durationTask: oldTask.durationTask || 0,
        userEmail: user.email,
        level: oldTask.level || 1,
        topicName: oldTask.topicName || 'introduction'
      };
      
      await Task.findOneAndUpdate(
        { taskId: newTask.taskId },
        newTask,
        { upsert: true, new: true }
      );
      
      console.log(`Migrated task: ${newTask.taskId}`);
    }
  } catch (error) {
    console.error('Error migrating tasks:', error);
    throw error;
  }
};

// Migration function for Posts
const migratePosts = async () => {
  console.log('Migrating posts...');
  
  try {
    const postsCollection = await getCollection('posts');
    const posts = await postsCollection.find({}).toArray();
    console.log(`Found ${posts.length} posts to migrate`);
    
    for (const oldPost of posts) {
      const newPost = {
        postId: oldPost._id.toString(),
        postContent: oldPost.postContent || '',
        picture: oldPost.picture,
        taskId: oldPost.taskId
      };
      
      await Post.findOneAndUpdate(
        { postId: newPost.postId },
        newPost,
        { upsert: true, new: true }
      );
      
      console.log(`Migrated post: ${newPost.postId}`);
    }
  } catch (error) {
    console.error('Error migrating posts:', error);
    throw error;
  }
};

// Migration function for Comments
const migrateComments = async () => {
  console.log('Migrating comments...');
  
  try {
    const commentsCollection = await getCollection('comments');
    const comments = await commentsCollection.find({}).toArray();
    console.log(`Found ${comments.length} comments to migrate`);
    
    for (const oldComment of comments) {
      const newComment = {
        commentId: oldComment._id.toString(),
        commentContent: oldComment.commentContent || '',
        feedback: oldComment.feedback,
        postId: oldComment.postId
      };
      
      await Comment.findOneAndUpdate(
        { commentId: newComment.commentId },
        newComment,
        { upsert: true, new: true }
      );
      
      console.log(`Migrated comment: ${newComment.commentId}`);
    }
  } catch (error) {
    console.error('Error migrating comments:', error);
    throw error;
  }
};

// Migration function for Interactive Sessions
const migrateInteractiveSessions = async () => {
  console.log('Migrating interactive sessions...');
  
  try {
    const sessionsCollection = await getCollection('interactivesessions');
    const sessions = await sessionsCollection.find({}).toArray();
    console.log(`Found ${sessions.length} interactive sessions to migrate`);
    
    for (const oldSession of sessions) {
      const newSession = {
        sessionId: oldSession._id.toString(),
        sessionType: oldSession.sessionType || 'PRESS_CONFERENCE',
        taskId: oldSession.taskId
      };
      
      await InteractiveSession.findOneAndUpdate(
        { sessionId: newSession.sessionId },
        newSession,
        { upsert: true, new: true }
      );
      
      console.log(`Migrated interactive session: ${newSession.sessionId}`);
    }
  } catch (error) {
    console.error('Error migrating interactive sessions:', error);
    throw error;
  }
};

// Migration function for Questions
const migrateQuestions = async () => {
  console.log('Migrating questions...');
  
  try {
    const questionsCollection = await getCollection('questions');
    const questions = await questionsCollection.find({}).toArray();
    console.log(`Found ${questions.length} questions to migrate`);
    
    for (const oldQuestion of questions) {
      const newQuestion = {
        questionId: oldQuestion._id.toString(),
        questionText: oldQuestion.questionText || '',
        answerText: oldQuestion.answerText || '',
        feedback: oldQuestion.feedback,
        sessionId: oldQuestion.sessionId
      };
      
      await Question.findOneAndUpdate(
        { questionId: newQuestion.questionId },
        newQuestion,
        { upsert: true, new: true }
      );
      
      console.log(`Migrated question: ${newQuestion.questionId}`);
    }
  } catch (error) {
    console.error('Error migrating questions:', error);
    throw error;
  }
};

// Migration function for Tests
const migrateTests = async () => {
  console.log('Migrating tests...');
  
  try {
    const testsCollection = await getCollection('tests');
    const tests = await testsCollection.find({}).toArray();
    console.log(`Found ${tests.length} tests to migrate`);
    
    for (const oldTest of tests) {
      const user = await User.findById(oldTest.userId);
      if (!user) {
        console.log(`User not found for test: ${oldTest._id}`);
        continue;
      }
      
      const newTest = {
        testId: oldTest._id.toString(),
        testScore: oldTest.testScore || 0,
        testType: oldTest.testType || 'VOCABULARY',
        completionDate: oldTest.completionDate || new Date(),
        durationTest: oldTest.durationTest || 0,
        userEmail: user.email
      };
      
      await Test.findOneAndUpdate(
        { testId: newTest.testId },
        newTest,
        { upsert: true, new: true }
      );
      
      console.log(`Migrated test: ${newTest.testId}`);
    }
  } catch (error) {
    console.error('Error migrating tests:', error);
    throw error;
  }
};

// Migration function for Levels
const migrateLevels = async () => {
  console.log('Migrating levels...');
  
  try {
    const levelsCollection = await getCollection('levels');
    const levels = await levelsCollection.find({}).toArray();
    console.log(`Found ${levels.length} levels to migrate`);
    
    for (const oldLevel of levels) {
      const newLevel = {
        level: oldLevel.level || 1,
        topicName: oldLevel.topicName || 'introduction',
        levelScore: oldLevel.levelScore || 0
      };
      
      await Level.findOneAndUpdate(
        { level: newLevel.level, topicName: newLevel.topicName },
        newLevel,
        { upsert: true, new: true }
      );
      
      console.log(`Migrated level: ${newLevel.level} for topic ${newLevel.topicName}`);
    }
  } catch (error) {
    console.error('Error migrating levels:', error);
    throw error;
  }
};

// Migration function for UserInLevel
const migrateUserInLevel = async () => {
  console.log('Migrating user levels...');
  
  try {
    const userProgressesCollection = await getCollection('userprogresses');
    const userProgresses = await userProgressesCollection.find({}).toArray();
    console.log(`Found ${userProgresses.length} user progresses to migrate`);
    
    for (const progress of userProgresses) {
      const user = await User.findById(progress.userId);
      if (!user) {
        console.log(`User not found for progress: ${progress._id}`);
        continue;
      }
      
      // Find the topic for this progress
      const topic = await Topic.findOne({ topicName: progress.topicName || 'introduction' });
      if (!topic) {
        console.log(`Topic not found for progress: ${progress._id}`);
        continue;
      }
      
      const newUserInLevel = {
        userEmail: user.email,
        level: progress.level || 1,
        topic: {
          topicName: topic.topicName,
          topicHe: topic.topicHe,
          icon: topic.icon
        },
        EarnedScore: progress.score || 0,
        completedAt: progress.completedAt,
        createdAt: progress.createdAt || new Date(),
        IsCompleted: progress.isCompleted || false
      };
      
      await UserInLevel.findOneAndUpdate(
        { 
          userEmail: newUserInLevel.userEmail,
          level: newUserInLevel.level,
          'topic.topicName': newUserInLevel.topic.topicName
        },
        newUserInLevel,
        { upsert: true, new: true }
      );
      
      console.log(`Migrated user level for ${user.email}, topic: ${newUserInLevel.topic.topicName}, level: ${newUserInLevel.level}`);
    }
  } catch (error) {
    console.error('Error migrating user levels:', error);
    throw error;
  }
};

// Main migration function
const migrate = async () => {
  try {
    console.log('Starting database migration...');
    
    // Connect to MongoDB
    const options = {
      dbName: 'unity-voice'
    };
    await mongoose.connect(MONGODB_URI, options);
    console.log('Connected to MongoDB successfully');
    
    // Create backup first
    await backupDatabase();
    
    // Run migrations
    await migrateUsers();
    await migrateTopics();
    await migrateWords();
    await migrateTasks();
    await migratePosts();
    await migrateComments();
    await migrateInteractiveSessions();
    await migrateQuestions();
    await migrateTests();
    await migrateLevels();
    await migrateUserInLevel();
    
    // Remove deprecated collections
    console.log('Removing deprecated collections...');
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not established');
      }
      
      const deprecatedCollections = ['achievements', 'userstats'];
      for (const collectionName of deprecatedCollections) {
        try {
          await db.collection(collectionName).drop();
          console.log(`Dropped collection: ${collectionName}`);
        } catch (error: unknown) {
          console.log(`Could not drop collection ${collectionName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      console.error('Error removing deprecated collections:', error);
    }
    
    console.log('Migration completed successfully!');
    
    // Close database connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Try to disconnect if connected
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
      }
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
    
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrate().catch((error: unknown) => {
    console.error('Unhandled error during migration:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

export { migrate };