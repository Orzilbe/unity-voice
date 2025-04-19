import { login } from '../controllers/authController';
import { generateToken } from '../utils/auth';
import User from '../models/User';

// Mock dependencies
jest.mock('../models/User');
jest.mock('../utils/auth');

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return user data and token for valid credentials', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        englishLevel: 'B2',
        score: 100,
        badge: 'Beginner'
      };

      const mockToken = 'mockToken';

      // Mock User.findOne
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Mock bcrypt.compare
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      // Mock generateToken
      (generateToken as jest.Mock).mockReturnValue(mockToken);

      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(generateToken).toHaveBeenCalledWith(mockUser._id, mockUser.email);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: {
          id: mockUser._id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          englishLevel: mockUser.englishLevel,
          score: mockUser.score,
          badge: mockUser.badge
        },
        token: mockToken
      });
    });

    it('should return 401 for invalid credentials', async () => {
      // Mock User.findOne to return null
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = {
        body: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });
}); 