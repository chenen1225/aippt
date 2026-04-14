
import { GoogleGenAI } from "@google/genai";
import { DesignConfig } from "../types";

export interface GenerateParams {
  content: string;
  config: DesignConfig;
  sourceImage?: string;
  isCreative?: boolean;
}

export class GeminiService {
  async generateDesignImage({
    content,
    config,
    sourceImage,
    isCreative = false
  }: GenerateParams): Promise<string | null> {
    try {
      // Use process.env.API_KEY directly as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-3-pro-image-preview';
      
      const colorContext = config.colorScheme || '绿、蓝、紫';
      const styleContext = config.style || 'UI设计';
      
      // 差异化 Prompt：根据是否有原图决定是“从零生成”还是“美化重构”
      const taskTypePrompt = sourceImage 
        ? "BEAUTIFY AND REFINE: Based on the provided SOURCE IMAGE, transform it into a professional, structured design." 
        : "CREATE FROM SCRATCH: Based on the following TEXT, generate a professional design.";

      const prompt = `
        You are a world-class PowerPoint Designer and System Architect.
        
        GOAL: ${taskTypePrompt}
        
        CONTENT INSTRUCTIONS:
        "${content || 'Maintain the core logic and information from the source image.'}"

        VISUAL STYLE CONSTRAINTS:
        - MANDATORY STYLE: ${styleContext}
        - MANDATORY COLOR PALETTE: ${colorContext}
        - Canvas Aspect Ratio: ${config.aspectRatio}
        ${config.referenceImage ? "- GLOBAL STYLE REFERENCE: Adhere to the aesthetic of the global style image." : ""}

        STRICT DESIGN RULES:
        1. NO list numbering.
        2. NO colons.
        3. Use professional shapes and arrows for logical connection.
        4. Add high-quality flat icons.
        5. Strictly use the "${styleContext}" style with refined finish.
        6. DISTILL TEXT: Use keywords only. NO ENGLISH in the design unless necessary.
        7. FONT: Use "Microsoft YaHei" or "Heiti" equivalent.
        8. BACKGROUND: PURE WHITE.
        
        Additional User Context: ${config.extraText}
        Requirements: ${config.detailedRequirements.join(', ')}
      `;

      // Simplified parts array handling
      const parts: any[] = [{ text: prompt }];

      // 1. 优先加入任务特有的原图 (图生图核心)
      if (sourceImage) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: sourceImage.split(',')[1]
          }
        });
      }

      // 2. 加入全局参考图 (风格迁移)
      if (config.referenceImage && !sourceImage) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: config.referenceImage.split(',')[1]
          }
        });
      }

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

      // Correctly iterate through parts to find the image as per guidelines
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      
      return null;
    } catch (error: any) {
      console.error("Image generation failed:", error);
      if (error.message?.includes("Requested entity was not found")) {
        throw new Error("API_KEY_RESET_REQUIRED");
      }
      return null;
    }
  }
}

export const geminiService = new GeminiService();
