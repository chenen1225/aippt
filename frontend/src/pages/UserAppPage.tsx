import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Image as ImageIcon, Key, ExternalLink, AlertCircle, X, Download, Copy, Check, Wand2, Grid, List, Trash2, Share2, LogOut, User } from 'lucide-react';
import { api } from '../services/api';

interface User {
  id: number;
  username: string;
  role: string;
  usageCount: number;
}

interface Image {
  id: number;
  url: string;
  prompt: string;
  createdAt: string;
}

const UserAppPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'generate' | 'gallery'>('generate');
  const [tasks, setTasks] = useState<any[]>([]);
  const [gallery, setGallery] = useState<Image[]>([]);
  const [galleryPage, setGalleryPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalImage, setModalImage] = useState<Image | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState({
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
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (view === 'gallery') {
      loadGallery();
    }
  }, [view, galleryPage]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const loadGallery = async () => {
    try {
      const result = await api.images.list(galleryPage, 20);
      setGallery(result.images);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      if (err.statusCode === 401) logout();
    }
  };

  const addTask = (type: 'text' | 'image') => {
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: '',
      status: 'idle' as const,
      timestamp: Date.now(),
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (id: string, content: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, content } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleBatchGenerate = async () => {
    if (!user || user.usageCount <= 0) {
      setError('使用次数不足，请联系管理员');
      return;
    }

    const idleTasks = tasks.filter(t => t.status === 'idle' && t.content.trim());
    if (idleTasks.length === 0) return;

    setLoading(true);
    setTasks(prev => prev.map(t => t.status === 'idle' ? { ...t, status: 'generating' } : t));

    for (const task of idleTasks) {
      try {
        const result = await api.images.generate(task.content, config);
        setTasks(prev => prev.map(t => t.id === task.id ? {
          ...t,
          status: 'completed',
          solutionA: result.image.url
        } : t));
        setUser(prev => prev ? { ...prev, usageCount: result.remainingUsage } : null);
        localStorage.setItem('user', JSON.stringify(user));
      } catch (err: any) {
        if (err.code === 'USAGE_EXHAUSTED') {
          setError('使用次数已用完');
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'idle' } : t));
          break;
        }
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error' } : t));
      }
    }
    setLoading(false);
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyFromModal = async () => {
    if (!modalImage) return;
    try {
      const response = await fetch(modalImage.url);
      const blob = await response.blob();
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      await navigator.clipboard.writeText(modalImage.url);
    }
  };

  const handleShare = async (imageId: number) => {
    try {
      const result = await api.share.create(imageId);
      const shareUrl = `${window.location.origin}/share/${result.shareCode}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('分享链接已复制到剪贴板');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('确定要删除该图片吗？')) return;
    try {
      await api.images.delete(imageId);
      loadGallery();
      setModalImage(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-gray-900">AI-PPT 生成器</h1>
            <nav className="flex gap-4">
              <button
                onClick={() => setView('generate')}
                className={`px-4 py-2 rounded-xl transition-colors ${view === 'generate' ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                生成图片
              </button>
              <button
                onClick={() => setView('gallery')}
                className={`px-4 py-2 rounded-xl transition-colors ${view === 'gallery' ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                我的图库
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
              <User size={16} className="text-gray-500" />
              <span className="font-medium">{user.username}</span>
              <span className="text-red-600 font-bold">{user.usageCount}</span>
              <span className="text-gray-500 text-sm">次</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 items-center">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <div className="text-sm text-red-800 flex-1">{error}</div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">×</button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {view === 'generate' ? (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">生成配置</h2>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">风格</label>
                  <select
                    value={config.style}
                    onChange={(e) => setConfig({ ...config, style: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500"
                  >
                    <option>UI设计</option>
                    <option>架构图</option>
                    <option>流程图</option>
                    <option>示意图</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">配色</label>
                  <select
                    value={config.colorScheme}
                    onChange={(e) => setConfig({ ...config, colorScheme: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500"
                  >
                    <option>绿、蓝、紫</option>
                    <option>红、橙、黄</option>
                    <option>黑白灰</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">比例</label>
                  <select
                    value={config.aspectRatio}
                    onChange={(e) => setConfig({ ...config, aspectRatio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500"
                  >
                    <option>16:9</option>
                    <option>4:3</option>
                    <option>1:1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">图片质量</label>
                  <select
                    value={config.imageSize}
                    onChange={(e) => setConfig({ ...config, imageSize: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500"
                  >
                    <option>1K</option>
                    <option>2K</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-6 mb-10">
              <button
                onClick={() => addTask('text')}
                disabled={loading}
                className="flex-1 py-5 bg-white border border-gray-200 hover:border-red-500 text-gray-700 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-4 font-bold text-lg group disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <span>+ 新建文本生成</span>
              </button>
            </div>

            <div className="space-y-8 pb-20">
              {tasks.map((task, index) => (
                <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <textarea
                        value={task.content}
                        onChange={(e) => updateTask(task.id, e.target.value)}
                        placeholder="输入你的设计要求或内容..."
                        className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 resize-none"
                        disabled={task.status === 'generating'}
                      />
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      disabled={task.status === 'generating'}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  {task.solutionA && (
                    <div className="mt-4">
                      <img
                        src={task.solutionA}
                        alt="Generated"
                        className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setModalImage({ id: 0, url: task.solutionA, prompt: task.content, createdAt: new Date().toISOString() })}
                      />
                    </div>
                  )}

                  {task.status === 'generating' && (
                    <div className="mt-4 flex items-center gap-3 text-gray-500">
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <span>生成中...</span>
                    </div>
                  )}

                  {task.status === 'error' && (
                    <div className="mt-4 text-red-500">生成失败，请重试</div>
                  )}
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-gray-300 border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-white/50">
                  <Wand2 size={64} className="mb-4 opacity-10" />
                  <p className="text-xl font-medium">开始您的 AI 专业设计之旅</p>
                  <p className="text-sm mt-2 opacity-60">点击上方按钮添加任务</p>
                </div>
              )}
            </div>

            {tasks.length > 0 && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                <button
                  onClick={handleBatchGenerate}
                  disabled={loading || tasks.every(t => t.status !== 'idle' || !t.content.trim())}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-2xl shadow-lg transition-all font-bold flex items-center gap-2"
                >
                  <Wand2 size={20} />
                  批量生成 ({tasks.filter(t => t.status === 'idle' && t.content.trim()).length})
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {gallery.map((img) => (
              <div key={img.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                <div className="relative aspect-video">
                  <img
                    src={img.url}
                    alt={img.prompt}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setModalImage(img)}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleShare(img.id)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDownload(img.url, `AIPPT_${img.id}.png`)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-500 truncate">{img.prompt}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(img.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 md:p-12">
          <button
            onClick={() => setModalImage(null)}
            className="absolute top-8 right-8 text-white/40 hover:text-white transition-all p-2 bg-white/10 rounded-full"
          >
            <X size={32} />
          </button>
          <div className="relative max-w-full max-h-[85vh] shadow-2xl rounded-2xl overflow-hidden border border-white/10">
            <img src={modalImage.url} alt={modalImage.prompt} className="max-w-full max-h-full object-contain" />
          </div>
          <div className="mt-10 flex gap-6">
            <button
              onClick={handleCopyFromModal}
              className="flex items-center gap-3 px-10 py-4 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-2xl active:scale-95"
            >
              {copyFeedback ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
              <span>{copyFeedback ? '复制成功' : '复制到剪贴板'}</span>
            </button>
            <button
              onClick={() => handleDownload(modalImage.url, `AIPPT_${modalImage.id}.png`)}
              className="flex items-center gap-3 px-10 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-2xl active:scale-95"
            >
              <Download size={20} />
              <span>保存设计稿</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAppPage;
