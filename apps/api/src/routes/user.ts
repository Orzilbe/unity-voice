// apps/api/src/routes/users.ts
import express from 'express';
import { protect } from '../middlewares/auth';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword,
  getUserBadges
} from '../controllers/userController';
import User from '../models/User';
import UserProgress from '../models/UserInLevel';
import { calculateBadgeProgress, EnglishLevel } from '@unity-voice/types';

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', protect, getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, updateUserProfile);

/**
 * @route   PUT /api/users/password
 * @desc    Change user password
 * @access  Private
 */
router.put('/password', protect, changePassword);

/**
 * @route   GET /api/users/badges
 * @desc    Get user badges information
 * @access  Private
 */
router.get('/badges', protect, getUserBadges);

/**
 * @route   GET /api/users/dashboard
 * @desc    Get user dashboard data with progress
 * @access  Private
 */
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find user in database
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Find user progress
    const userProgress = await UserProgress.findOne({ userId });
    
    // Calculate completed tasks
    const completedChallenges = userProgress?.topic?.reduce((total, topic) => {
      // Count all completed tasks across all topic and levels
      const topicCompletedChallenges = topic.levels?.reduce((levelTotal, level) => {
        const levelCompletedChallenges = level.tasks?.filter(task => 
          task.completed
        ).length || 0;
        return levelTotal + levelCompletedChallenges;
      }, 0) || 0;
      
      return total + topicCompletedChallenges;
    }, 0) || 0;
    
    // Format the "active since" date
    const activeSince = user.createdAt 
      ? new Date(user.createdAt).toLocaleDateString() 
      : 'New User';
    
    // Calculate the current badge
    const points = user.score || 0;
    const badgeProgress = calculateBadgeProgress(points);
    
    // Format data for dashboard
    const dashboardData = {
      success: true,
      data: {
        user: {
          id: user._id,
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          englishLevel: user.englishLevel || EnglishLevel.BEGINNER,
          phoneNumber: user.phoneNumber,
          profilePicture: user.profilePicture,
          ageRange: user.ageRange,
          role: user.role,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        },
        stats: {
          totalPoints: userProgress?.totalPoints || 0,
          rank: userProgress?.rank || 'beginner',
          completedChallenges,
          completedTopics: userProgress?.topic?.filter(t => t.completed).length || 0,
          activeSince,
          lastActivity: userProgress?.lastActivityDate || user.lastLogin || user.createdAt
        },
        badge: {
          current: badgeProgress.currentBadge,
          next: badgeProgress.nextBadge,
          pointsToNextBadge: badgeProgress.pointsToNextBadge,
          earnedBadges: badgeProgress.earnedBadges
        }
      }
    };
    
    return res.status(200).json(dashboardData);
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

export default router;