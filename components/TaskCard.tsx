
import React, { useRef } from 'react';
import { Trash2, Copy, FileText, Loader2, Plus, Sparkles, Download, Check, Upload, Image as ImageIcon, Wand2 } from 'lucide-react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  onUpdate: (id: string, content: string) => void;
  onUpdateImage?: (id: string, imageData: string) => void;
  onDelete: (id: string) => void;
  onGenerateSolutionB: (id: string) => void;
  onViewDetails: (imageUrl: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onUpdate, onUpdateImage, onDelete, onGenerateSolutionB, onViewDetails }) => {
  const [copiedA, setCopiedA] = React.useState(false);
  const [copiedB, setCopiedB] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async (url: string, isA: boolean) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      if (isA) { setCopiedA(true); setTimeout(() => setCopiedA(false), 2000); }
      else { setCopiedB(true); setTimeout(() => setCopiedB(false), 2000); }
    } catch (err) {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateImage) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateImage(task.id, reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const quickPrompts = task.type === 'image' 
    ? ['一键美化', '转化为3D风格', '重构为极简版', 'PPT标准翻新']
    : ['提炼核心点', '增加逻辑箭头', '商务风格化'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col lg:flex-row mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Left Input Section */}
      <div className="lg:w-[45%] p-6 border-r border-gray-100 flex flex-col bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 bg-red-500 text-white rounded text-xs flex items-center justify-center font-bold">
              {index + 1}
            </span>
            <div className="flex items-center gap-2 text-gray-500">
              {task.type === 'image' ? <ImageIcon size={18} /> : <FileText size={18} />}
              <span className="font-bold text-sm text-gray-700">
                {task.type === 'image' ? '图生图：架构/PPT翻新' : '文生图：创意生成'}
              </span>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${task.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            {task.status === 'completed' ? '完成' : task.status === 'generating' ? '生成中' : '等待中'}
          </span>
        </div>

        {task.type === 'image' && (
          <div className="mb-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden relative group"
            >
              {task.sourceImage ? (
                <>
                  <img src={task.sourceImage} alt="Source" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-2">
                      <Upload size={14} /> 替换原图
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                    <Upload className="text-gray-400" size={20} />
                  </div>
                  <p className="text-xs text-gray-400">点击上传需要美化的架构图/PPT截图</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
        )}
        
        <div className="relative flex-1">
          <textarea
            className="w-full h-full min-h-[120px] p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-sm leading-relaxed custom-scrollbar"
            placeholder={task.type === 'image' ? "输入修改意见（例如：美化此架构图，增加3D效果，统一配色）" : "输入您的架构描述、PPT大纲或文本内容..."}
            value={task.content}
            onChange={(e) => onUpdate(task.id, e.target.value)}
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            {quickPrompts.slice(0, 2).map(p => (
              <button 
                key={p}
                onClick={() => onUpdate(task.id, p)}
                className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] text-gray-500 hover:border-red-300 hover:text-red-500 transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Output Section */}
      <div className="lg:w-[55%] p-6 bg-gray-50/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Wand2 size={16} className="text-red-500" />
            设计输出
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onDelete(task.id)}
              className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Solution A */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Solution A / Standard</div>
            <div className="aspect-[16/10] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center relative group">
              {task.status === 'generating' && !task.solutionA ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-red-100 border-t-red-500 rounded-full animate-spin" />
                  <span className="text-[10px] font-bold text-gray-400">正在重构设计...</span>
                </div>
              ) : task.solutionA ? (
                <>
                  <img src={task.solutionA} alt="Solution A" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                     <div className="flex gap-2 translate-y-4 group-hover:translate-y-0 transition-transform">
                        <button onClick={() => handleCopy(task.solutionA!, true)} className="bg-white p-2 rounded-lg hover:bg-gray-100 transition-all">
                          {copiedA ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                        <button onClick={() => handleDownload(task.solutionA!, `DESIGN_A_${task.id}.png`)} className="bg-white p-2 rounded-lg hover:bg-gray-100 transition-all">
                          <Download size={18} />
                        </button>
                     </div>
                     <button onClick={() => onViewDetails(task.solutionA!)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-xs font-bold transition-all">查看大图</button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-20">
                   <ImageIcon size={32} />
                   <span className="text-[10px] font-bold">等待生成</span>
                </div>
              )}
            </div>
          </div>

          {/* Solution B */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Solution B / Creative</div>
            <div className="aspect-[16/10] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center relative group">
              {task.status === 'generating' && task.solutionA && !task.solutionB ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-red-500" />
                  <span className="text-[10px] text-gray-400">创意探索中...</span>
                </div>
              ) : task.solutionB ? (
                <>
                  <img src={task.solutionB} alt="Solution B" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                     <div className="flex gap-2 translate-y-4 group-hover:translate-y-0 transition-transform">
                        <button onClick={() => handleCopy(task.solutionB!, false)} className="bg-white p-2 rounded-lg hover:bg-gray-100 transition-all">
                          {copiedB ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                        <button onClick={() => handleDownload(task.solutionB!, `DESIGN_B_${task.id}.png`)} className="bg-white p-2 rounded-lg hover:bg-gray-100 transition-all">
                          <Download size={18} />
                        </button>
                     </div>
                     <button onClick={() => onViewDetails(task.solutionB!)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-xs font-bold transition-all">查看大图</button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center px-4">
                  <div className="w-10 h-10 bg-red-50 text-red-400 rounded-full flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <button 
                    onClick={() => onGenerateSolutionB(task.id)}
                    disabled={task.status === 'generating' || (!task.content && !task.sourceImage)}
                    className="flex items-center gap-2 px-4 py-1.5 border border-red-200 rounded-lg text-[10px] text-red-500 hover:bg-red-50 transition-all font-bold disabled:opacity-30"
                  >
                    <Plus size={12} /> 生成创意方案 B
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
