// apps/api/src/controllers/writingController.ts
import { Request, Response } from 'express';
import { WritingService } from '../services/writingService';
import { auth } from '../middlewares/auth';

export class WritingController {
  static async getChallenge(req: Request, res: Response) {
    try {
      const { topicId, levelId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const task = await WritingService.getOrCreateChallenge(
        userId,
        parseInt(topicId),
        parseInt(levelId)
      );

      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async submitResponse(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { response } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!response) {
        return res.status(400).json({ error: 'Response is required' });
      }

      const result = await WritingService.submitResponse(userId, taskId, response);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
} 