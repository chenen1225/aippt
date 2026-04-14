import { Router } from 'express';
import { z } from 'zod';
import { imageService } from '../services/imageService.js';
import { userService } from '../services/userService.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import path from 'path';

const router = Router();

router.use(authenticate);

const generateSchema = z.object({
  content: z.string().min(1),
  config: z.object({
    style: z.string(),
    colorScheme: z.string(),
    aspectRatio: z.string(),
    imageSize: z.string(),
    detailedRequirements: z.array(z.string()),
    extraText: z.string().optional()
  })
});

router.post('/generate', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    await userService.decrementUsage(userId);
    
    const { content, config } = generateSchema.parse(req.body);
    const result = await imageService.generate({ userId, content, config });
    
    const updatedUser = await userService.findById(userId);
    
    res.json({ 
      success: true, 
      data: {
        image: result,
        remainingUsage: updatedUser?.usageCount || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    
    const result = await imageService.findByUser(userId, page, pageSize);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    const image = await imageService.findById(id, userId);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: { code: 'IMAGE_NOT_FOUND', message: '图片不存在' }
      });
    }
    
    res.json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    await imageService.delete(id, userId);
    res.json({ success: true, data: { message: '图片已删除' } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/download', async (req: AuthRequest, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    const filepath = await imageService.getFilePath(id, userId);
    res.download(filepath);
  } catch (error) {
    next(error);
  }
});

export default router;
