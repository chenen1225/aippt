
import React from 'react';
import { LayoutGrid, History, Trash2, Download, Zap } from 'lucide-react';

interface HeaderProps {
  onBatchGenerate: () => void;
  onBatchDownload: () => void;
  onClearTasks: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBatchGenerate, onBatchDownload, onClearTasks }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-800">架构图和PPT生成器</span>
        </div>
        
        <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button className="flex items-center gap-2 px-4 py-1.5 bg-white text-red-600 rounded-md shadow-sm font-medium transition-all">
            <LayoutGrid size={18} />
            <span>工作台</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 text-gray-500 hover:text-gray-700 rounded-md transition-all">
            <History size={18} />
            <span>历史记录</span>
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onClearTasks}
          title="清空所有任务"
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={onBatchDownload}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all active:scale-95"
        >
          <Download size={18} />
          <span>批量下载</span>
        </button>
        <button 
          onClick={onBatchGenerate}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-red-500 to-rose-400 text-white rounded-lg shadow-lg hover:from-red-600 hover:to-rose-500 transition-all font-medium active:scale-95"
        >
          <Zap size={18} />
          <span>批量生成</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
