'use client';

import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'picture' | 'chart' | 'essay'>('picture');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult('');
    
    try {
      // 模擬/呼叫後端 API
      const res = await fetch('/api/essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, type: activeTab }),
      });
      const data = await res.json();
      setResult(data.result || '成功生成！請查看建議架構與單字。');
    } catch (err) {
      setResult('生成時發生錯誤，請確認 API Key 是否設定正確。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 max-w-4xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          🎓 學測英文作文靈感導師
        </h1>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          輸入作文題目或情境，立即獲取高分單字、句型與段落架構
        </p>
      </header>

      {/* 題型選擇 */}
      <div className="flex border-b border-slate-800 mb-6">
        {[
          { id: 'picture', label: '📷 看圖寫作' },
          { id: 'chart', label: '📊 圖表分析' },
          { id: 'essay', label: '✍️ 主題論述' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 題目輸入區 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            題目描述 / 作文情境：
          </label>
          <textarea
            rows={4}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              activeTab === 'picture'
                ? '例如：第一張圖為主角在排隊買限量商品，第二張圖突然有人插隊...'
                : activeTab === 'chart'
                ? '例如：描述青少年使用社群媒體的時間變化圖表...'
                : '例如：討論高中生是否應該禁止攜帶手機到學校...'
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder:text-slate-600"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 font-medium rounded-xl transition text-sm flex items-center justify-center gap-2"
        >
          {loading ? '思考中，正在生成大綱與單字...' : '✨ 產生高分寫作大綱與建議'}
        </button>
      </div>

      {/* 結果展示區 */}
      {result && (
        <div className="mt-8 p-6 bg-slate-900/80 border border-slate-800 rounded-xl">
          <h3 className="text-lg font-semibold text-indigo-400 mb-3">💡 靈感導師建議：</h3>
          <div className="whitespace-pre-line text-slate-300 text-sm leading-relaxed">
            {result}
          </div>
        </div>
      )}
    </main>
  );
}