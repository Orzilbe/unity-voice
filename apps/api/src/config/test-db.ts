// apps/api/src/config/test-db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI defined:', !!process.env.MONGODB_URI);
    
    const options = {
      dbName: 'unity-voice'
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI as string, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Check database access and list collections
    if (!conn.connection.db) {
      throw new Error('Database connection is not available');
    }
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Connection error:', error);
  }
}

export default testConnection;