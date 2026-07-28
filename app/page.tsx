'use client';

import { useState } from 'react';
import { generateEssayHelp } from './actions';

type TabType = 'picture' | 'chart' | 'essay';

const TAB_CONFIG: Record<TabType, { label: string; placeholder: string; examples: string[] }> = {
  picture: {
    label: '看圖寫作',
    placeholder: '請描述四格漫畫或圖片的情境細節...',
    examples: [
      '第一張圖主角在排隊買限量商品，第二張圖突然有人插隊...',
      '第一張圖大家在公園野餐，第二張圖開始下大雨，第三張圖...',
    ],
  },
  chart: {
    label: '圖表分析',
    placeholder: '請描述圖表主題、數據趨勢與主要對比...',
    examples: [
      '描述 2010 年至 2020 年台灣青少年使用社群媒體的時間變化圖表...',
      '比較高中生選擇打工與參加社團的比例變化...',
    ],
  },
  essay: {
    label: '主題論述',
    placeholder: '請輸入作文題目或欲討論的核心情境...',
    examples: [
      '討論高中生是否應該被禁止攜帶智慧型手機到學校...',
      '面對失敗與挫折時，你認為最重要的心態是什麼？',
    ],
  },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('picture');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult('');

    try {
      const res = await generateEssayHelp(topic, TAB_CONFIG[activeTab].label);
      setResult(res);
    } catch (err) {
      setResult('生成失敗，請確認伺服器與 API Key 設定。');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="space-y-3 text-center md:text-left border-b border-slate-800/80 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
            GSAT Writing Assistant
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-50">
            學測英文作文靈感導師
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
            針對看圖寫作、圖表分析與主題論述，即時剖析破題立意、段落架構與高分詞彙。
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          {(Object.keys(TAB_CONFIG) as TabType[]).map((tabKey) => {
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => {
                  setActiveTab(tabKey);
                  setTopic('');
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {TAB_CONFIG[tabKey].label}
              </button>
            );
          })}
        </div>

        {/* Input & Action Area */}
        <div className="space-y-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-center text-sm font-medium text-slate-300">
            <label htmlFor="topic-input">題目或情境敘述</label>
            <span className="text-xs text-slate-500">{topic.length} 字</span>
          </div>

          <div className="relative">
            <textarea
              id="topic-input"
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={TAB_CONFIG[activeTab].placeholder}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all resize-none leading-relaxed"
            />
            {topic && (
              <button
                onClick={() => setTopic('')}
                className="absolute top-3 right-3 text-xs text-slate-500 hover:text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 transition"
              >
                清空
              </button>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="space-y-2">
            <span className="text-xs text-slate-500 block">快速試用範例：</span>
            <div className="flex flex-wrap gap-2">
              {TAB_CONFIG[activeTab].examples.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setTopic(ex)}
                  className="text-xs text-slate-400 hover:text-indigo-300 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 px-3 py-1.5 rounded-lg transition text-left truncate max-w-xs"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 disabled:text-slate-600 font-semibold rounded-xl text-slate-50 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在解析題目並生成寫作建議...
              </span>
            ) : (
              '分析題目並生成建議'
            )}
          </button>
        </div>

        {/* Loading State (Skeleton) */}
        {loading && (
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4 animate-pulse">
            <div className="h-5 bg-slate-800 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-800/60 rounded w-full"></div>
              <div className="h-4 bg-slate-800/60 rounded w-5/6"></div>
              <div className="h-4 bg-slate-800/60 rounded w-4/6"></div>
            </div>
          </div>
        )}

        {/* Result Area */}
        {result && !loading && (
          <div className="p-6 bg-slate-900/60 border border-slate-800/90 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-semibold text-indigo-400">寫作指導與建議內容</h2>
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 border border-slate-700/50"
              >
                {copied ? '已複製到剪貼簿' : '複製內容'}
              </button>
            </div>
            <div className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed tracking-wide font-sans">
              {result}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}