// apps/api/src/config/db.ts
import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Using URI:', process.env.MONGODB_URI ? 'URI is defined' : 'URI is undefined');
    
    // Set connection options
    const options = {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Increase socket timeout
      dbName: 'unity-voice' // Specify the database name
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI as string, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error details:`, error);
    process.exit(1);
  }
};

export default connectDB;