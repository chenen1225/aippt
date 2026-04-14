import { prisma } from '../app.js';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = 'uploads';

export interface GenerateParams {
  userId: number;
  content: string;
  config: {
    style: string;
    colorScheme: string;
    aspectRatio: string;
    imageSize: string;
    detailedRequirements: string[];
    extraText?: string;
  };
}

export const imageService = {
  async generate({ userId, content, config }: GenerateParams) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const error: any = new Error('未配置 API Key');
      error.statusCode = 500;
      error.code = 'API_KEY_NOT_CONFIGURED';
      throw error;
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-pro-image-preview';

    const colorContext = config.colorScheme || '绿、蓝、紫';
    const styleContext = config.style || 'UI设计';

    const prompt = `
      You are a world-class PowerPoint Designer and System Architect.
      
      CREATE FROM SCRATCH: Based on the following TEXT, generate a professional design.
      
      CONTENT INSTRUCTIONS:
      "${content}"

      VISUAL STYLE CONSTRAINTS:
      - MANDATORY STYLE: ${styleContext}
      - MANDATORY COLOR PALETTE: ${colorContext}
      - Canvas Aspect Ratio: ${config.aspectRatio}

      STRICT DESIGN RULES:
      1. NO list numbering.
      2. NO colons.
      3. Use professional shapes and arrows for logical connection.
      4. Add high-quality flat icons.
      5. Strictly use the "${styleContext}" style with refined finish.
      6. DISTILL TEXT: Use keywords only. NO ENGLISH in the design unless necessary.
      7. FONT: Use "Microsoft YaHei" or "Heiti" equivalent.
      8. BACKGROUND: PURE WHITE.
      
      Additional User Context: ${config.extraText || ''}
      Requirements: ${config.detailedRequirements.join(', ')}
    `;

    const parts: any[] = [{ text: prompt }];

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio as any,
          imageSize: config.imageSize as any,
        }
      }
    });

    let imageBase64: string | null = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!imageBase64) {
      const error: any = new Error('图片生成失败');
      error.statusCode = 500;
      error.code = 'GENERATION_FAILED';
      throw error;
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${uuidv4()}.png`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filepath, Buffer.from(imageBase64, 'base64'));

    const image = await prisma.image.create({
      data: {
        userId,
        filename,
        originalName: `AI_Generated_${Date.now()}.png`,
        url: `/uploads/${filename}`,
        prompt: content,
        config: config as any
      }
    });

    return {
      id: image.id,
      url: image.url,
      prompt: image.prompt
    };
  },

  async findByUser(userId: number, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.image.count({ where: { userId } })
    ]);

    return { images, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async findById(id: number, userId: number) {
    return prisma.image.findFirst({
      where: { id, userId }
    });
  },

  async delete(id: number, userId: number) {
    const image = await prisma.image.findFirst({
      where: { id, userId }
    });

    if (!image) {
      const error: any = new Error('图片不存在');
      error.statusCode = 404;
      error.code = 'IMAGE_NOT_FOUND';
      throw error;
    }

    await fs.unlink(path.join(UPLOAD_DIR, image.filename)).catch(() => {});

    return prisma.image.delete({ where: { id } });
  },

  async getFilePath(id: number, userId: number) {
    const image = await prisma.image.findFirst({
      where: { id, userId }
    });

    if (!image) {
      const error: any = new Error('图片不存在');
      error.statusCode = 404;
      error.code = 'IMAGE_NOT_FOUND';
      throw error;
    }

    return path.join(UPLOAD_DIR, image.filename);
  }
};
