// apps/api/src/services/userInitialization.ts
import { v4 as uuidv4 } from 'uuid';
import Task, { TaskType } from '../models/Task';
import Word from '../models/Word';
import WordInTask from '../models/WordInTask';
import { topicWords, getTopicWords } from '../data/topicWords';

type EnglishLevel = 'beginner' | 'intermediate' | 'advanced';

export async function initializeUserTasks(userId: string, englishLevel: EnglishLevel) {
  try {
    console.log(`Initializing tasks for user ${userId} with English level ${englishLevel}`);
    
    // Get all topic
    const topic = Object.keys(topicWords);
    
    // For each topic, create a task and associate words
    for (const topic of topic) {
      console.log(`\nProcessing topic: ${topic}`);
      
      // Create task
      const taskId = uuidv4();
      const newTask = new Task({
        taskId,
        taskScore: 0,
        taskType: TaskType.WORD,
        userId,
        level: 1,
        topic
      });
      
      await newTask.save();
      console.log(`Created task ${taskId} for topic ${topic}`);
      
      // Get words for this topic and difficulty
      const wordsForTopic = getTopicWords(topic, englishLevel);
      
      if (!wordsForTopic || wordsForTopic.length === 0) {
        console.log(`No words found for topic ${topic} at ${englishLevel} level`);
        continue;
      }
      
      // Take first 5 words for level 1
      const initialWords = wordsForTopic.slice(0, 5);
      
      // Add words to database and associate with task
      for (const wordData of initialWords) {
        // Create word if it doesn't exist
        const wordId = uuidv4();
        
        try {
          // Check if word already exists
          let existingWord = await Word.findOne({ word: wordData.word });
          
          if (!existingWord) {
            const newWord = new Word({
              wordId,
              word: wordData.word,
              translation: wordData.translation,
              exampleUsage: wordData.examples[0] || '',
              pronunciation: '' // This could be filled in later
            });
            
            existingWord = await newWord.save();
            console.log(`Created word ${wordId}: ${wordData.word}`);
          }
          
          // Associate word with task
          const wordInTask = new WordInTask({
            wordId: existingWord.wordId,
            taskId,
            isCompleted: false,
            score: 0,
            attempts: 0
          });
          
          await wordInTask.save();
          console.log(`Associated word ${existingWord.wordId}: ${wordData.word} with task ${taskId}`);
        } catch (error) {
          console.error(`Error processing word ${wordData.word}:`, error);
          // Continue with next word
          continue;
        }
      }
    }
    
    console.log(`\nSuccessfully initialized tasks and words for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error initializing user tasks:', error);
    throw error;
  }
}

export async function createNextLevelTask(userId: string, completedTaskId: string) {
  try {
    // Find the completed task
    const completedTask = await Task.findOne({ taskId: completedTaskId });
    if (!completedTask) {
      throw new Error('Completed task not found');
    }

    // Find the user's current level for this topic
    const currentLevel = completedTask.level;
    const topic = completedTask.topic;

    // Create new task for next level
    const newTaskId = uuidv4();
    const newTask = new Task({
      taskId: newTaskId,
      taskScore: 0,
      taskType: TaskType.WORD,
      userId,
      level: currentLevel + 1,
      topic
    });

    await newTask.save();

    // Get all words for this topic
    const allWords = getTopicWords(topic, 'intermediate'); // Use intermediate words for higher levels
    
    // Get words already used in previous levels
    const userTasks = await Task.find({ userId, topic });
    const taskIds = userTasks.map(task => task.taskId);
    const usedWords = await WordInTask.find({ taskId: { $in: taskIds } }).distinct('wordId');

    // Filter out used words and take next 5
    const availableWords = [];
    for (const word of allWords) {
      const existingWord = await Word.findOne({ word: word.word });
      if (existingWord && !usedWords.includes(existingWord.wordId)) {
        availableWords.push(word);
        if (availableWords.length === 5) break;
      }
    }

    // Add new words to task
    for (const wordData of availableWords) {
      let word = await Word.findOne({ word: wordData.word });
      
      if (!word) {
        word = await new Word({
          wordId: uuidv4(),
          word: wordData.word,
          translation: wordData.translation,
          exampleUsage: wordData.examples[0] || '',
          pronunciation: ''
        }).save();
      }

      await new WordInTask({
        wordId: word.wordId,
        taskId: newTaskId,
        isCompleted: false,
        score: 0,
        attempts: 0
      }).save();
    }

    return newTask;
  } catch (error) {
    console.error('Error creating next level task:', error);
    throw error;
  }
} 