// apps/api/src/routes/auth.ts
import express from 'express';
import { login, register, refreshToken } from '../controllers/authController';
import { protect } from '../middlewares/auth';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh authentication token
 * @access  Private
 */
router.post('/refresh', protect, refreshToken);

export default router;