import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Copy, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const SharePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [image, setImage] = useState<{ url: string; prompt: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (code) {
      loadShare();
    }
  }, [code]);

  const loadShare = async () => {
    try {
      const data = await api.share.get(code!);
      setImage(data);
    } catch (err: any) {
      setError(err.message || '分享不存在或已失效');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!image) return;
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      await navigator.clipboard.writeText(image.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">分享已失效</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
          >
            登录使用 AI-PPT
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={image!.url}
            alt={image!.prompt}
            className="w-full object-contain max-h-[70vh]"
          />
          <div className="p-6">
            <p className="text-gray-300 mb-4">{image!.prompt}</p>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">由 AI-PPT 生成器创建</span>
              <div className="flex gap-4">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? '已复制' : '复制图片'}
                </button>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                >
                  <ExternalLink size={16} />
                  登录使用
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePage;
