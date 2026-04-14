import { prisma } from '../app.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const userService = {
  async findAll() {
    return prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        username: true,
        role: true,
        usageCount: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        username: true,
        role: true,
        usageCount: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
  },

  async update(id: number, data: { usageCount?: number; password?: string }) {
    const updateData: any = { ...data };
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        usageCount: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
  },

  async delete(id: number) {
    return prisma.user.update({
      where: { id },
      data: { isDeleted: true }
    });
  },

  async decrementUsage(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.usageCount <= 0) {
      const error: any = new Error('使用次数不足');
      error.statusCode = 403;
      error.code = 'USAGE_EXHAUSTED';
      throw error;
    }

    return prisma.user.update({
      where: { id },
      data: { usageCount: { decrement: 1 } }
    });
  }
};
