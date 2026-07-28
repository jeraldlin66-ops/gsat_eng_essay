'use client';

import { useState } from 'react';
import { generateEssayHelp } from './actions';

type MainMode = 'guidance' | 'correction';
type GuidanceType = 'picture' | 'chart' | 'essay' | 'vocab';
type TargetScore = 'under10' | '11to15' | '16to20';

const GUIDANCE_CONFIG: Record<GuidanceType, { label: string; placeholder: string; examples: string[] }> = {
  picture: {
    label: '看圖寫作',
    placeholder: '描述四格漫畫或圖片的情境細節...',
    examples: [
      '第一張圖主角在排隊買限量商品，第二張圖突然有人插隊...',
      '第一張圖大家在公園野餐，第二張圖突然下大雨...',
    ],
  },
  chart: {
    label: '圖表分析',
    placeholder: '描述圖表主題、數據趨勢與主要對比...',
    examples: [
      '描述 2010 年至 2020 年台灣青少年使用社群媒體的時間變化...',
      '比較高中生選擇打工與參加社團的比例變化...',
    ],
  },
  essay: {
    label: '主題論述',
    placeholder: '輸入作文題目或欲討論的核心話題...',
    examples: [
      '討論高中生是否應該被禁止攜帶智慧型手機到學校...',
      '面對失敗與挫折時，你認為最重要的心態是什麼？',
    ],
  },
  vocab: {
    label: '單字片語發想',
    placeholder: '輸入你想寫的主題主題（例如：AI科技、環保、心理壓力...）',
    examples: [
      '關於「人工智慧對未來工作影響」的高級單字片語',
      '關於「現代人焦慮與心理健康」的高分描寫詞彙',
    ],
  },
};

const SCORE_OPTIONS: { id: TargetScore; label: string; desc: string }[] = [
  { id: 'under10', label: '10 分以下', desc: '基礎打底 · 通順句構與常用詞彙' },
  { id: '11to15', label: '11 ~ 15 分', desc: '進階提升 · 轉折句型與段落銜接' },
  { id: '16to20', label: '16 ~ 20 分', desc: '高分頂尖 · 頂級修辭與深層立意' },
];

export default function Home() {
  const [mainMode, setMainMode] = useState<MainMode>('guidance');
  const [guidanceType, setGuidanceType] = useState<GuidanceType>('picture');
  const [targetScore, setTargetScore] = useState<TargetScore>('11to15');
  
  const [topic, setTopic] = useState('');
  const [userEssay, setUserEssay] = useState('');
  const [loading, setLoading] = useState(false);

  // 結果狀態
  const [guidanceResult, setGuidanceResult] = useState('');
  const [correctionResult, setCorrectionResult] = useState<{
    summary: string;
    errors: string;
    modelEssay: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    if (mainMode === 'correction' && !userEssay.trim()) return;

    setLoading(true);
    setGuidanceResult('');
    setCorrectionResult(null);

    try {
      const subTypeName = mainMode === 'guidance' ? GUIDANCE_CONFIG[guidanceType].label : '作文批改';
      const res = await generateEssayHelp(mainMode, subTypeName, targetScore, topic, userEssay);

      if (res.error) {
        alert(res.error);
      } else if (res.text) {
        setGuidanceResult(res.text);
      } else if (res.correctionResult) {
        setCorrectionResult(res.correctionResult);
      }
    } catch (err) {
      alert('生成失敗，請確認伺服器設定。');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="space-y-3 text-center md:text-left border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold tracking-wide uppercase">
            GSAT Writing Hub
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            學測英文作文 AI 導師
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-2xl leading-relaxed">
            分層級靈感引導與大考中心（CEEC）標準精準批改，全方位帶領你向高分邁進。
          </p>
        </header>

        {/* 主分區：引導區 vs 批改區 */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/60">
          <button
            onClick={() => {
              setMainMode('guidance');
              setGuidanceResult('');
              setCorrectionResult(null);
            }}
            className={`py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              mainMode === 'guidance'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            💡 作文靈感引導區
          </button>
          <button
            onClick={() => {
              setMainMode('correction');
              setGuidanceResult('');
              setCorrectionResult(null);
            }}
            className={`py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              mainMode === 'correction'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            📝 深度作文批改區（大考標準）
          </button>
        </div>

        {/* 引導區子選單 */}
        {mainMode === 'guidance' && (
          <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {(Object.keys(GUIDANCE_CONFIG) as GuidanceType[]).map((key) => {
              const isActive = guidanceType === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setGuidanceType(key);
                    setTopic('');
                  }}
                  className={`flex-1 min-w-[120px] py-2 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {GUIDANCE_CONFIG[key].label}
                </button>
              );
            })}
          </div>
        )}

        {/* 🌟 目標分數區間選擇器 */}
        <div className="space-y-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            選擇你的目標分數 / 目前程度區間
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SCORE_OPTIONS.map((opt) => {
              const isSelected = targetScore === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTargetScore(opt.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className={`text-sm font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 輸入區塊 */}
        <div className="space-y-5 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* 題目欄位 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
              <label htmlFor="topic-input">
                {mainMode === 'guidance' ? '作文題目 / 欲發想的情境' : '1. 作文題目描述'}
              </label>
              <span className="text-xs text-slate-400 font-normal">{topic.length} 字</span>
            </div>
            <textarea
              id="topic-input"
              rows={mainMode === 'correction' ? 2 : 4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                mainMode === 'guidance'
                  ? GUIDANCE_CONFIG[guidanceType].placeholder
                  : '請輸入作文題目描述或提示...'
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all resize-none leading-relaxed"
            />
          </div>

          {/* 批改區特有：英文內文輸入欄 */}
          {mainMode === 'correction' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                <label htmlFor="essay-input">2. 貼上英文作文全文（將檢驗文法、拼字、標點與組織）</label>
                <span className="text-xs text-slate-400 font-normal">{userEssay.length} 字</span>
              </div>
              <textarea
                id="essay-input"
                rows={8}
                value={userEssay}
                onChange={(e) => setUserEssay(e.target.value)}
                placeholder="Please paste your full English essay here..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all resize-none leading-relaxed font-mono"
              />
            </div>
          )}

          {/* 試用範例 */}
          {mainMode === 'guidance' && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-400 block">快速點擊試用：</span>
              <div className="flex flex-wrap gap-2">
                {GUIDANCE_CONFIG[guidanceType].examples.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTopic(ex)}
                    className="text-xs text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 px-3 py-1.5 rounded-lg transition text-left truncate max-w-xs"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 淺綠色生成按鈕 */}
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim() || (mainMode === 'correction' && !userEssay.trim())}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 font-bold rounded-xl text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mainMode === 'correction' ? '大考標準比對與精細批改中...' : '生成靈感與寫作引導中...'}
              </span>
            ) : mainMode === 'correction' ? (
              '進行大考標準精細批改'
            ) : (
              '產生寫作引導與高分詞彙'
            )}
          </button>
        </div>

        {/* Loading 動畫 */}
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

        {/* 💡 引導結果展示區 */}
        {guidanceResult && !loading && (
          <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-emerald-900">寫作引導與詞彙發想建議</h2>
              <button
                onClick={() => handleCopy(guidanceResult)}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium transition flex items-center gap-1.5 border border-emerald-200"
              >
                {copied ? '已複製內容' : '複製內容'}
              </button>
            </div>
            <div className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed tracking-wide font-sans">
              {guidanceResult}
            </div>
          </div>
        )}

        {/* 📝 批改結果展示區 (綠框 / 紅框 / 深綠框) */}
        {correctionResult && !loading && (
          <div className="space-y-6">
            
            {/* 🟢 總評區塊 (綠框) */}
            <div className="p-6 md:p-8 bg-emerald-50/50 border-2 border-emerald-500 rounded-2xl shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-200 pb-3">
                <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                  <span>🟢</span> 總評與四大維度評分（大考中心 CEEC 標準）
                </h3>
                <button
                  onClick={() => handleCopy(correctionResult.summary)}
                  className="text-xs px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium transition"
                >
                  複製總評
                </button>
              </div>
              <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">
                {correctionResult.summary}
              </div>
            </div>

            {/* 🔴 文法用語錯誤對照 (紅框) */}
            {correctionResult.errors && (
              <div className="p-6 md:p-8 bg-rose-50/50 border-2 border-rose-500 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-rose-200 pb-3">
                  <h3 className="text-lg font-bold text-rose-900 flex items-center gap-2">
                    <span>🔴</span> 文法、用語與標點符號修正
                  </h3>
                  <button
                    onClick={() => handleCopy(correctionResult.errors)}
                    className="text-xs px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-medium transition"
                  >
                    複製修正對照
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">
                  {correctionResult.errors}
                </div>
              </div>
            )}

            {/* 🌲 適合範文 (深綠框) */}
            {correctionResult.modelEssay && (
              <div className="p-6 md:p-8 bg-emerald-950/5 border-2 border-emerald-800 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-800/20 pb-3">
                  <h3 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                    <span>🌲</span> 適合該目標層級的示範範文 (Model Essay)
                  </h3>
                  <button
                    onClick={() => handleCopy(correctionResult.modelEssay)}
                    className="text-xs px-2.5 py-1 rounded bg-emerald-800 text-white hover:bg-emerald-900 font-medium transition"
                  >
                    複製範文
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed font-serif">
                  {correctionResult.modelEssay}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </main>
  );
}