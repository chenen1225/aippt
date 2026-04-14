import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1)
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const result = await authService.login(username, password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    res.json({ 
      success: true, 
      data: {
        id: req.user!.id,
        username: req.user!.username,
        role: req.user!.role
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
