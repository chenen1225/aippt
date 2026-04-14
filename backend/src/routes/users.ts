import { Router } from 'express';
import { z } from 'zod';
import { userService } from '../services/userService.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

const createUserSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(6).max(100),
  usageCount: z.number().int().min(0).optional()
});

const updateUserSchema = z.object({
  usageCount: z.number().int().min(0).optional(),
  password: z.string().min(6).max(100).optional()
});

router.get('/', async (req, res, next) => {
  try {
    const users = await userService.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { username, password, usageCount } = createUserSchema.parse(req.body);
    const user = await userService.register(
      username, 
      password, 
      'user', 
      usageCount || 0
    );
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = updateUserSchema.parse(req.body);
    const user = await userService.update(id, data);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await userService.delete(id);
    res.json({ success: true, data: { message: '用户已删除' } });
  } catch (error) {
    next(error);
  }
});

export default router;
