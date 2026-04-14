import { Router } from 'express';
import { shareService } from '../services/shareService.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/:id/share', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const imageId = parseInt(req.params.id);
    const userId = req.user!.id;
    const result = await shareService.create(imageId, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await shareService.getByCode(code);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/revoke', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    await shareService.revoke(id, userId);
    res.json({ success: true, data: { message: '分享已撤销' } });
  } catch (error) {
    next(error);
  }
});

export default router;
