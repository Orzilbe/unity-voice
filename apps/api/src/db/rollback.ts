// apps/api/src/db/rollback.ts

import mongoose, { Connection } from 'mongoose';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

interface BackupData {
  [key: string]: any[];
}

const rollback = async () => {
  let connection: mongoose.Connection | null = null;
  
  try {
    console.log('Starting database rollback...');
    
    // Connect to MongoDB
    const options = {
      dbName: 'unity-voice'
    };
    connection = await mongoose.createConnection(MONGODB_URI, options);
    console.log('Connected to MongoDB');
    
    if (!connection.db) {
      throw new Error('Failed to get database connection');
    }
    
    // Read backup file
    const backupPath = path.join(__dirname, 'backup.json');
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }
    
    const backup: BackupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Restore collections
    for (const [collectionName, documents] of Object.entries(backup)) {
      console.log(`Restoring collection: ${collectionName}`);
      
      // Drop existing collection
      await connection.db.collection(collectionName).drop().catch(() => {
        console.log(`Collection ${collectionName} does not exist, skipping drop`);
      });
      
      // Create new collection and insert documents
      if (documents.length > 0) {
        await connection.db.collection(collectionName).insertMany(documents);
      }
    }
    
    console.log('Rollback completed successfully');
    
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

// Run rollback if this file is executed directly
if (require.main === module) {
  rollback().catch(console.error);
}

export { rollback }; 