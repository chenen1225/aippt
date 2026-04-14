
import React, { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Key, ExternalLink, AlertCircle, X, Download, Copy, Check, Wand2 } from 'lucide-react';
import Header from './components/Header';
import ConfigPanel from './components/ConfigPanel';
import TaskCard from './components/TaskCard';
import { Task, DesignConfig } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [config, setConfig] = useState<DesignConfig>({
    style: 'UI设计',
    colorScheme: '绿、蓝、紫',
    aspectRatio: '16:9',
    imageSize: '1K',
    detailedRequirements: [
      '去掉序号', '去掉冒号', '形状箭头串联', '增加图标', 
      '模块化设计', '层级/流程形式', '黑体字', '标题置顶居中',
      '纯白色背景', '精致效果', '提炼精简文案'
    ],
    extraText: '',
  });

  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const exists = await window.aistudio.hasSelectedApiKey();
      setHasKey(exists);
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setHasKey(true);
  };

  const addTask = (type: 'text' | 'image') => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: '',
      status: 'idle',
      timestamp: Date.now(),
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (id: string, content: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, content } : t));
  };

  const updateTaskImage = (id: string, sourceImage: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, sourceImage } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleBatchGenerate = async () => {
    const idleTasks = tasks.filter(t => t.status === 'idle');
    if (idleTasks.length === 0) return;

    setTasks(prev => prev.map(t => t.status === 'idle' ? { ...t, status: 'generating' } : t));

    for (const task of idleTasks) {
      // 如果既没有指令也没有原图，跳过
      if (!task.content.trim() && !task.sourceImage) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'idle' } : t));
        continue;
      }

      try {
        const solutionA = await geminiService.generateDesignImage({
          content: task.content,
          config,
          sourceImage: task.sourceImage,
          isCreative: false
        });
        setTasks(prev => prev.map(t => t.id === task.id ? {
          ...t,
          status: 'completed',
          solutionA: solutionA || t.solutionA
        } : t));
      } catch (error: any) {
        if (error.message === 'API_KEY_RESET_REQUIRED') {
          setHasKey(false);
          break;
        }
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error' } : t));
      }
    }
  };

  const handleBatchDownload = () => {
    const completedTasks = tasks.filter(t => t.solutionA || t.solutionB);
    if (completedTasks.length === 0) {
      alert("没有已完成的任务可下载。");
      return;
    }
    completedTasks.forEach((task, index) => {
      setTimeout(() => {
        if (task.solutionA) {
          const link = document.createElement('a');
          link.href = task.solutionA;
          link.download = `AIPPT_A_${task.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        if (task.solutionB) {
          const link = document.createElement('a');
          link.href = task.solutionB;
          link.download = `AIPPT_B_${task.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }, index * 200);
    });
  };

  const handleClearTasks = () => {
    if (confirm("确定要清空所有任务吗？")) {
      setTasks([]);
    }
  };

  const handleGenerateSolutionB = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'generating' } : t));
    try {
      const solutionB = await geminiService.generateDesignImage({
        content: task.content,
        config,
        sourceImage: task.sourceImage,
        isCreative: true
      });
      setTasks(prev => prev.map(t => t.id === id ? {
        ...t,
        status: 'completed',
        solutionB: solutionB || t.solutionB
      } : t));
    } catch (error: any) {
      if (error.message === 'API_KEY_RESET_REQUIRED') setHasKey(false);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    }
  };

  const handleCopyFromModal = async () => {
    if (!modalImage) return;
    try {
      const response = await fetch(modalImage);
      const blob = await response.blob();
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      await navigator.clipboard.writeText(modalImage);
    }
  };

  const handleDownloadFromModal = () => {
    if (!modalImage) return;
    const link = document.createElement('a');
    link.href = modalImage;
    link.download = 'DESIGN_EXPORT.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto">
            <Key size={40} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">配置 API KEY</h1>
            <p className="text-gray-500 leading-relaxed text-sm">
              本项目使用 <strong>Gemini 3 Pro Image</strong> 模型。请选择您的付费版 API Key 以继续。
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left flex gap-3">
            <AlertCircle className="text-amber-500 shrink-0" size={20} />
            <div className="text-[11px] text-amber-800">
              <p className="font-bold">重要：</p>
              <p>请确保项目已启用 Google Cloud 结算。</p>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-amber-600 underline font-bold mt-1 inline-block">查看文档</a>
            </div>
          </div>
          <button onClick={handleOpenKeySelector} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg transition-all font-bold active:scale-95 flex items-center justify-center gap-2">
            <Key size={18} /> 立即选择 API KEY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Header onBatchGenerate={handleBatchGenerate} onBatchDownload={handleBatchDownload} onClearTasks={handleClearTasks} />
      
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        <ConfigPanel config={config} setConfig={setConfig} />

        <div className="flex gap-6 mb-10 sticky top-20 z-40">
          <button onClick={() => addTask('text')} className="flex-1 py-5 bg-white border border-gray-200 hover:border-red-500 text-gray-700 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-4 font-bold text-lg group">
            <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <span>+ 新建文本生成</span>
          </button>
          <button onClick={() => addTask('image')} className="flex-1 py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg transition-all flex items-center justify-center gap-4 font-bold text-lg group">
             <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ImageIcon size={24} />
            </div>
            <span>+ 图片重构美化</span>
          </button>
        </div>

        <div className="space-y-8 pb-20">
          {tasks.map((task, index) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              index={index}
              onUpdate={updateTask}
              onUpdateImage={updateTaskImage}
              onDelete={deleteTask}
              onGenerateSolutionB={handleGenerateSolutionB}
              onViewDetails={setModalImage}
            />
          ))}
          
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-gray-300 border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-white/50">
              <Wand2 size={64} className="mb-4 opacity-10" />
              <p className="text-xl font-medium">开始您的 AI 专业设计之旅</p>
              <p className="text-sm mt-2 opacity-60">选择上方模式添加任务，支持批量生成与重构</p>
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 text-center text-gray-400 text-xs border-t border-gray-100 bg-white">
        <p>© 2024 专业架构图和PPT生成器 - Powered by Gemini 3 Pro Image Intelligence</p>
      </footer>

      {/* Detail Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 md:p-12 animate-in fade-in duration-300">
          <button onClick={() => setModalImage(null)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-all p-2 bg-white/10 rounded-full">
            <X size={32} />
          </button>
          <div className="relative max-w-full max-h-[85vh] shadow-2xl rounded-2xl overflow-hidden border border-white/10">
            <img src={modalImage} alt="Detail" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="mt-10 flex gap-6">
            <button onClick={handleCopyFromModal} className="flex items-center gap-3 px-10 py-4 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-2xl active:scale-95">
              {copyFeedback ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
              <span>{copyFeedback ? '复制成功' : '复制到剪贴板'}</span>
            </button>
            <button onClick={handleDownloadFromModal} className="flex items-center gap-3 px-10 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-2xl active:scale-95">
              <Download size={20} />
              <span>保存设计稿</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
