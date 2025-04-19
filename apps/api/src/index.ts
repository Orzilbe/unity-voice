// apps/api/src/index.ts
import dotenv from 'dotenv';
import path from 'path';

// Load env vars with explicit path - MUST BE FIRST
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading environment variables from:', envPath);

// Load environment variables
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Verify JWT_SECRET is loaded
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set in environment variables!');
  console.error('Please check your .env file at:', envPath);
  process.exit(1);
}

console.log('Environment variables loaded successfully');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Present' : 'MISSING');

// Import other dependencies after env is loaded
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import userRoutes from './routes/userRoutes';
import topicRoutes from './routes/topic';
import wordRoutes from './routes/wordRoutes';
import flashcardRoutes from './routes/flashcardRoutes';
import learnedWordsRoutes from './routes/learnedWordsRoutes';
import connectDB from './config/db';
import userTopicProgressRoutes from './routes/userTopicProgress';
import quizRoutes from './routes/quizRoutes';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Enhanced CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://127.0.0.1:3000',
      'http://[::1]:3000',
      undefined // Allow requests with no origin (like mobile apps or curl requests)
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
};

// Debug middleware for CORS and requests
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`🌐 Incoming ${req.method} request to ${req.path}`);
    console.log('Origin:', req.get('origin'));
    console.log('Headers:', req.headers);
    next();
  });
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/user-topic-level', userTopicProgressRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/learned-words', learnedWordsRoutes);
app.use('/api/quiz', quizRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/debug/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API debug endpoint is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint to test authorization-free access
app.get('/api/debug/flashcards', (req, res) => {
  res.json({
    success: true,
    message: 'Flashcards debug endpoint is working',
    data: [
      { id: 'debug1', word: 'hello', translation: 'שלום' },
      { id: 'debug2', word: 'world', translation: 'עולם' }
    ]
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong!'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Server is running on http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

app.get('/api/test-auth', (req, res) => {
  const authHeader = req.headers.authorization;
  res.json({
    hasAuth: !!authHeader,
    authHeader: authHeader || 'None',
    time: new Date().toISOString()
  });
});

// 2. בדיקה האם הנתיבים החדשים נטענים
app.get('/api/route-test', (req, res) => {
  res.json({
    routes: {
      flashcards: typeof flashcardRoutes !== 'undefined',
      learnedWords: typeof learnedWordsRoutes !== 'undefined'
    },
    message: 'Routes test endpoint'
  });
});