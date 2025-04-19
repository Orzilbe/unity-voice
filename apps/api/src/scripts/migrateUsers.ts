import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

async function migrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/unity-voice');
    console.log('Connected to MongoDB');

    // Find all users without uniqueId
    const users = await User.find({ uniqueId: { $exists: false } });
    console.log(`Found ${users.length} users to migrate`);

    // Add uniqueId to each user
    for (const user of users) {
      user.uniqueId = crypto.randomBytes(16).toString('hex');
      await user.save();
      console.log(`Migrated user: ${user.email}`);
    }

    console.log('Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateUsers(); 