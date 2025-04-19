// apps/api/src/scripts/migrateToUserProgress.js
/**
 * Migration script to move data from UserInLevel to the new UserProgress model
 * Run with: node migrateToUserProgress.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected');
  migrateData();
}).catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Import models
const UserInLevel = require('../models/UserInLevel');
const Topic = require('../models/Topic');
const Level = require('../models/Level');
const UserProgress = require('../models/UserProgress');

async function migrateData() {
  try {
    console.log('Starting migration...');
    
    // Get all UserInLevel records
    const userInLevelRecords = await UserInLevel.find();
    console.log(`Found ${userInLevelRecords.length} UserInLevel records to migrate`);
    
    // Group records by userId
    const userGroups = {};
    userInLevelRecords.forEach(record => {
      if (!userGroups[record.userId]) {
        userGroups[record.userId] = [];
      }
      userGroups[record.userId].push(record);
    });
    
    // Process each user
    for (const userId in userGroups) {
      console.log(`Processing user ${userId}...`);
      
      // Check if user already has UserProgress
      let userProgress = await UserProgress.findOne({ userId });
      
      if (!userProgress) {
        // Create new UserProgress
        userProgress = new UserProgress({
          userId,
          topic: [],
          learnedWords: [],
          badges: [],
          stats: {
            totalScore: 0,
            totalTopicsCompleted: 0,
            totalLevelsCompleted: 0,
            totalTasksCompleted: 0,
            totalWordsLearned: 0,
            totalConversations: 0,
            totalPosts: 0,
            lastActivityAt: new Date()
          }
        });
      }
      
      // Process each topic for this user
      for (const record of userGroups[userId]) {
        // Find the topic by name
        const topicName = record.topic.topicName;
        const topic = await Topic.findOne({ topicName });
        
        if (!topic) {
          console.warn(`Topic ${topicName} not found, skipping`);
          continue;
        }
        
        const topicId = topic._id.toString();
        
        // Check if topic already exists in user progress
        let topicProgress = userProgress.topic.find(t => t.topicId.toString() === topicId);
        
        if (!topicProgress) {
          // Add new topic progress
          topicProgress = {
            topicId,
            completed: record.IsCompleted,
            earnedScore: record.EarnedScore || 0,
            currentLevel: record.level,
            startedAt: record.createdAt,
            completedAt: record.IsCompleted ? record.completedAt : undefined,
            levels: []
          };
          
          userProgress.topic.push(topicProgress);
        } else {
          // Update existing topic progress
          topicProgress.completed = record.IsCompleted;
          topicProgress.earnedScore = Math.max(topicProgress.earnedScore, record.EarnedScore || 0);
          topicProgress.currentLevel = Math.max(topicProgress.currentLevel, record.level);
          topicProgress.completedAt = record.IsCompleted ? record.completedAt : topicProgress.completedAt;
        }
        
        // Get levels for this topic
        const levels = await Level.find({ topicId }).sort({ order: 1 });
        
        // Process levels up to current level
        for (let i = 0; i < Math.min(record.level, levels.length); i++) {
          const level = levels[i];
          const levelId = level._id.toString();
          
          // Check if level already exists in topic progress
          let levelProgress = topicProgress.levels.find(l => l.levelId.toString() === levelId);
          
          if (!levelProgress) {
            // Add new level progress
            const isCurrentLevel = i + 1 === record.level;
            const isCompleted = i + 1 < record.level || (isCurrentLevel && record.IsCompleted);
            
            levelProgress = {
              levelId,
              completed: isCompleted,
              earnedScore: 0, // We don't have this data in UserInLevel
              startedAt: record.createdAt,
              completedAt: isCompleted ? record.completedAt : undefined,
              tasks: []
            };
            
            topicProgress.levels.push(levelProgress);
            
            // Add placeholder task entries
            level.tasks.forEach(task => {
              levelProgress.tasks.push({
                taskId: task._id.toString(),
                type: task.type || 'words', // Default to 'words' if not specified
                completed: isCompleted,
                score: 0, // We don't have this data
                attempts: 0, // We don't have this data
                lastAttempt: isCompleted ? record.completedAt : undefined
              });
            });
          }
        }
      }
      
      // Save the user progress
      await userProgress.save();
      console.log(`Migrated data for user ${userId}`);
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}