
import React, { useRef } from 'react';
import { Upload, Sparkles, Palette, Maximize, FileText, Monitor } from 'lucide-react';
import { DesignConfig, AspectRatio, ImageSize } from '../types';

interface ConfigPanelProps {
  config: DesignConfig;
  setConfig: React.Dispatch<React.SetStateAction<DesignConfig>>;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const styles = ['商务风', '科技风', '党政风', '插画风', '中国风', 'UI设计'];
  const detailOptions = [
    '去掉序号', '去掉冒号', '形状箭头串联', '增加图标', 
    '模块化设计', '层级/流程形式', '黑体字', '标题置顶居中',
    '纯白色背景', '精致效果', '提炼精简文案'
  ];
  
  // Ratios 必须匹配 API 支持的值: '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'
  const ratios: { label: string; value: AspectRatio }[] = [
    { label: '16:9 宽屏演示', value: '16:9' },
    { label: '9:16 手机竖屏', value: '9:16' },
    { label: '21:9 全面屏', value: '21:9' },
    { label: '4:3 标准比例', value: '4:3' },
    { label: '3:4 宣传手册', value: '3:4' },
    { label: '1:1 正方形', value: '1:1' },
    { label: '3:2 经典横屏', value: '3:2' },
    { label: '2:3 经典竖屏', value: '2:3' },
    { label: '4:5 社交媒体', value: '4:5' },
    { label: '5:4 传统比例', value: '5:4' },
  ];
  const sizes: ImageSize[] = ["1K", "2K", "4K"];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, referenceImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDetail = (detail: string) => {
    setConfig(prev => ({
      ...prev,
      detailedRequirements: prev.detailedRequirements.includes(detail)
        ? prev.detailedRequirements.filter(d => d !== detail)
        : [...prev.detailedRequirements, detail]
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Style Reference Image */}
        <div className="col-span-1">
          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            风格参考图
          </h3>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/5] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all group overflow-hidden relative"
          >
            {config.referenceImage ? (
              <img src={config.referenceImage} alt="Reference" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Upload className="text-gray-400" size={24} />
                </div>
                <p className="text-xs text-gray-400">上传/粘贴参考图</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>
        </div>

        {/* Style and Ratio Column */}
        <div className="col-span-1 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <Sparkles size={16} /> PPT 风格
            </h3>
            <div className="flex flex-wrap gap-2">
              {styles.map(s => (
                <button
                  key={s}
                  onClick={() => setConfig(prev => ({ ...prev, style: s }))}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${config.style === s ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <Maximize size={16} /> 画布比例
            </h3>
            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {ratios.map((r, i) => (
                <button
                  key={`${r.value}-${i}`}
                  onClick={() => setConfig(prev => ({ ...prev, aspectRatio: r.value }))}
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg border text-[10px] transition-all ${config.aspectRatio === r.value ? 'border-red-500 bg-red-50 text-red-600 ring-1 ring-red-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className={`w-2 h-2 rounded-full border shrink-0 ${config.aspectRatio === r.value ? 'border-red-500 bg-red-500' : 'border-gray-300'}`} />
                  <span className="truncate" title={r.label}>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <Monitor size={16} /> 分辨率 (Pro)
            </h3>
            <div className="flex gap-2">
              {sizes.map(s => (
                <button
                  key={s}
                  onClick={() => setConfig(prev => ({ ...prev, imageSize: s }))}
                  className={`flex-1 py-2 rounded-lg border text-xs transition-all font-bold ${config.imageSize === s ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Color Palette Column */}
        <div className="col-span-1">
          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <Palette size={16} /> 配色方案
          </h3>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all mb-3 text-sm"
            placeholder="输入配色方案..."
            value={config.colorScheme}
            onChange={(e) => setConfig(prev => ({ ...prev, colorScheme: e.target.value }))}
          />
          <div className="flex flex-wrap gap-2">
             {['绿、蓝、紫', '科技蓝', '活力橙', '中国红', '高级灰'].map(c => (
                <button 
                  key={c}
                  onClick={() => setConfig(prev => ({ ...prev, colorScheme: c }))}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${config.colorScheme === c ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {c}
                </button>
             ))}
          </div>
        </div>

        {/* Requirements Column */}
        <div className="col-span-1">
          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <FileText size={16} /> 详细设计要求
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-4 max-h-[140px] overflow-y-auto custom-scrollbar">
            {detailOptions.map(d => (
              <button
                key={d}
                onClick={() => toggleDetail(d)}
                className={`px-2 py-1 rounded border text-[10px] transition-all ${config.detailedRequirements.includes(d) ? 'border-red-500 text-red-500 bg-red-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                {d}
              </button>
            ))}
          </div>
          <textarea
            className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-sm resize-none custom-scrollbar bg-gray-50/50"
            placeholder="输入额外详细要求..."
            value={config.extraText}
            onChange={(e) => setConfig(prev => ({ ...prev, extraText: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
