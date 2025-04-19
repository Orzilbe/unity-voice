// apps/api/src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { EnglishLevel, UserRole, AgeRange, BadgeType } from '@unity-voice/types';

export interface IUser extends Document {
  uniqueId: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
  ageRange: AgeRange;
  englishLevel: EnglishLevel;
  profilePicture?: string;
  totalScore?: number;
  createdAt: Date;
  lastLogin?: Date;
  badge?: {
    type: BadgeType;
    name: string;
    icon: string;
    description: string;
    pointsRequired: number;
    id: number;
    dateEarned: Date;
  };
  role: UserRole;
  isActive: boolean;
  topic?: string[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Function to generate a more structured unique ID
function generateUniqueUserId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(5).toString('hex');
  return `usr_${timestamp}_${randomStr}`;
}

const UserSchema: Schema = new Schema({
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    default: generateUniqueUserId
  },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  ageRange: { 
    type: String, 
    required: true,
    validate: {
      validator: function(value: string) {
        return Object.values(AgeRange).includes(value as AgeRange) || 
               Object.values(AgeRange).some(enumValue => enumValue.replace('AGE_', '') === value);
      },
      message: (props: { value: string }) => `${props.value} is not a valid value for ageRange`
    }
  },
  englishLevel: { 
    type: String, 
    required: true,
    enum: Object.values(EnglishLevel),
    default: EnglishLevel.BEGINNER
  },
  profilePicture: { type: String },
  score: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  // Change badge from String to Object with structure
  badge: {
    type: {
      type: String,
      enum: Object.values(BadgeType)
    },
    name: { type: String },
    icon: { type: String },
    description: { type: String },
    pointsRequired: { type: Number },
    id: { type: Number },
    dateEarned: { type: Date }
  },
  role: { 
    type: String, 
    enum: Object.values(UserRole),
    default: UserRole.USER
  },
  isActive: { type: Boolean, default: true },
  level: { type: Number, default: 1 },
  topic: [{ type: String }]
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

export default mongoose.model<IUser>('User', UserSchema);
