
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
export type ImageSize = "1K" | "2K" | "4K";

export interface Task {
  id: string;
  type: 'text' | 'image';
  content: string;
  sourceImage?: string; // 用于图生图任务的源图
  status: 'idle' | 'generating' | 'completed' | 'error';
  solutionA?: string;
  solutionB?: string;
  timestamp: number;
}

export interface DesignConfig {
  style: string;
  colorScheme: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  detailedRequirements: string[];
  extraText: string;
  referenceImage?: string;
}
