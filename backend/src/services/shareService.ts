import { prisma } from '../app.js';
import { v4 as uuidv4 } from 'uuid';

export const shareService = {
  async create(imageId: number, userId: number, expiresInDays?: number) {
    const image = await prisma.image.findFirst({
      where: { id: imageId, userId }
    });

    if (!image) {
      const error: any = new Error('图片不存在');
      error.statusCode = 404;
      error.code = 'IMAGE_NOT_FOUND';
      throw error;
    }

    const existingShare = await prisma.share.findFirst({
      where: { imageId, isActive: true }
    });

    if (existingShare) {
      return {
        id: existingShare.id,
        shareCode: existingShare.shareCode,
        url: `/share/${existingShare.shareCode}`
      };
    }

    const shareCode = uuidv4().substring(0, 8);
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const share = await prisma.share.create({
      data: {
        imageId,
        shareCode,
        expiresAt
      }
    });

    return {
      id: share.id,
      shareCode: share.shareCode,
      url: `/share/${share.shareCode}`
    };
  },

  async getByCode(shareCode: string) {
    const share = await prisma.share.findUnique({
      where: { shareCode },
      include: { image: true }
    });

    if (!share || !share.isActive) {
      const error: any = new Error('分享不存在或已失效');
      error.statusCode = 404;
      error.code = 'SHARE_NOT_FOUND';
      throw error;
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      const error: any = new Error('分享已过期');
      error.statusCode = 410;
      error.code = 'SHARE_EXPIRED';
      throw error;
    }

    await prisma.share.update({
      where: { id: share.id },
      data: { visitCount: { increment: 1 } }
    });

    return {
      url: share.image.url,
      prompt: share.image.prompt,
      visitCount: share.visitCount + 1
    };
  },

  async revoke(id: number, userId: number) {
    const share = await prisma.share.findUnique({
      where: { id },
      include: { image: true }
    });

    if (!share) {
      const error: any = new Error('分享不存在');
      error.statusCode = 404;
      error.code = 'SHARE_NOT_FOUND';
      throw error;
    }

    if (share.image.userId !== userId) {
      const error: any = new Error('无权撤销此分享');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    return prisma.share.update({
      where: { id },
      data: { isActive: false }
    });
  }
};
