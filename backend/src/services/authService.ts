import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../app.js';
import type { Role } from '@prisma/client';

const SALT_ROUNDS = 12;
const TOKEN_EXPIRES_IN = '24h';

export interface LoginResult {
  token: string;
  user: {
    id: number;
    username: string;
    role: Role;
    usageCount: number;
  };
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResult> {
    const user = await prisma.user.findUnique({
      where: { username, isDeleted: false }
    });

    if (!user) {
      const error: any = new Error('用户名或密码错误');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const error: any = new Error('用户名或密码错误');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: TOKEN_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        usageCount: user.usageCount
      }
    };
  },

  async register(
    username: string,
    password: string,
    role: Role = 'user',
    initialUsageCount: number = 0
  ) {
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      const error: any = new Error('用户名已存在');
      error.statusCode = 400;
      error.code = 'USERNAME_EXISTS';
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        usageCount: initialUsageCount
      }
    });

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      usageCount: user.usageCount
    };
  }
};
