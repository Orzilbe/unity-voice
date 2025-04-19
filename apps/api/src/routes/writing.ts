// apps/api/src/routes/writing.ts
import { Router } from 'express';
import { WritingController } from '../controllers/writingController';
import { auth } from '../middlewares/auth';

const router = Router();

router.get('/:topicId/:levelId', auth, WritingController.getChallenge);
router.post('/:taskId/submit', auth, WritingController.submitResponse);

export default router; 