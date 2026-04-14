import { Router } from 'express';
import { prisma } from '../app.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/stats', async (req, res, next) => {
  try {
    const [userCount, imageCount, shareCount] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.image.count(),
      prisma.share.count({ where: { isActive: true } })
    ]);

    const totalUsage = await prisma.user.aggregate({
      where: { isDeleted: false, role: 'user' },
      _sum: { usageCount: true }
    });

    res.json({
      success: true,
      data: {
        userCount,
        imageCount,
        shareCount,
        totalUsageRemaining: totalUsage._sum.usageCount || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
