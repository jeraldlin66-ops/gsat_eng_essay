'use client';

import { useState } from 'react';
import { generateEssayHelp } from './actions';

type TabType = 'picture' | 'chart' | 'essay' | 'correction';

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
  correction: {
    label: '作文批改',
    placeholder: '請輸入作文題目描述...',
    examples: [
      '題目：討論高中生是否應該攜帶手機到校。',
    ],
  },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('picture');
  const [topic, setTopic] = useState('');
  const [userEssay, setUserEssay] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    if (activeTab === 'correction' && !userEssay.trim()) return;

    setLoading(true);
    setResult('');

    try {
      const res = await generateEssayHelp(
        topic,
        TAB_CONFIG[activeTab].label,
        activeTab === 'correction' ? userEssay : undefined
      );
      setResult(res);
    } catch (err) {
      setResult('生成失敗，請確認伺服器設定。');
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
    <main className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="space-y-3 text-center md:text-left border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
            GSAT English Writing Mentor
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            學測英文作文 AI 靈感與批改導師
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-2xl leading-relaxed">
            提供全方位寫作支援：看圖寫作、圖表分析、主題論述靈感發想，以及全文 AI 精準批改與評分。
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex p-1.5 bg-slate-200/70 rounded-xl border border-slate-300/60">
          {(Object.keys(TAB_CONFIG) as TabType[]).map((tabKey) => {
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => {
                  setActiveTab(tabKey);
                  setTopic('');
                  setUserEssay('');
                  setResult('');
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                {TAB_CONFIG[tabKey].label}
              </button>
            );
          })}
        </div>

        {/* Input & Action Area */}
        <div className="space-y-5 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* 題目輸入框 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
              <label htmlFor="topic-input">1. 作文題目 / 情境描述</label>
              <span className="text-xs text-slate-400 font-normal">{topic.length} 字</span>
            </div>
            <textarea
              id="topic-input"
              rows={activeTab === 'correction' ? 2 : 4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={TAB_CONFIG[activeTab].placeholder}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm transition-all resize-none leading-relaxed"
            />
          </div>

          {/* 批改專用：英文文章輸入框 */}
          {activeTab === 'correction' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                <label htmlFor="essay-input">2. 貼上你的英文作文全文</label>
                <span className="text-xs text-slate-400 font-normal">{userEssay.length} 字</span>
              </div>
              <textarea
                id="essay-input"
                rows={8}
                value={userEssay}
                onChange={(e) => setUserEssay(e.target.value)}
                placeholder="Please paste your full English essay here..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm transition-all resize-none leading-relaxed font-mono"
              />
            </div>
          )}

          {/* 快速試用範例 */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 block">快速試用範例：</span>
            <div className="flex flex-wrap gap-2">
              {TAB_CONFIG[activeTab].examples.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setTopic(ex)}
                  className="text-xs text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 px-3 py-1.5 rounded-lg transition text-left truncate max-w-xs"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* 提交按鈕 */}
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim() || (activeTab === 'correction' && !userEssay.trim())}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 font-semibold rounded-xl text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {activeTab === 'correction' ? '正在細心批改與計算分數...' : '正在分析題目並生成寫作建議...'}
              </span>
            ) : activeTab === 'correction' ? (
              '開始精細批改作文'
            ) : (
              '生成寫作指導與建議'
            )}
          </button>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
              <div className="h-4 bg-slate-100 rounded w-4/6"></div>
            </div>
          </div>
        )}

        {/* 結果展示區 */}
        {result && !loading && (
          <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-indigo-900">
                {activeTab === 'correction' ? '作文批改與分析報告' : '寫作指導與建議內容'}
              </h2>
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition flex items-center gap-1.5 border border-slate-200"
              >
                {copied ? '已複製內容' : '複製建議'}
              </button>
            </div>
            <div className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed tracking-wide font-sans">
              {result}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}