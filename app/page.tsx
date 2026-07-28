'use client';

import { useState } from 'react';
import { generateEssayHelp } from './actions';

type MainMode = 'guidance' | 'correction';
type GuidanceType = 'picture' | 'chart' | 'essay' | 'vocab';
type TargetScore = 'under10' | '11to15' | '16to20';

const GUIDANCE_CONFIG: Record<GuidanceType, { label: string; placeholder: string; examples: string[] }> = {
  picture: {
    label: '看圖寫作 (Picture Writing)',
    placeholder: '可直接上傳四格漫畫圖片/PDF 題目卷，或在此輸入文字描述...',
    examples: [
      '第一張圖主角在排隊買限量商品，第二張圖突然有人插隊...',
      '第一張圖大家在公園野餐，第二張圖突然下大雨...',
    ],
  },
  chart: {
    label: '圖表分析 (Data & Charts)',
    placeholder: '可上傳圖表圖片/PDF，或描述圖表趨勢與數據對比...',
    examples: [
      '描述 2010 年至 2020 年台灣青少年使用社群媒體的時間變化...',
      '比較高中生選擇打工與參加社團的比例變化...',
    ],
  },
  essay: {
    label: '主題論述 (Argumentative)',
    placeholder: '輸入作文題目、貼上題目卷 PDF，或描述核心話題...',
    examples: [
      '討論高中生是否應該被禁止攜帶智慧型手機到學校...',
      '面對失敗與挫折時，你認為最重要的心態是什麼？',
    ],
  },
  vocab: {
    label: '單字片語發想 (Lexical Resource)',
    placeholder: '輸入主題關鍵字（如：AI科技、氣候變遷、心理健康）...',
    examples: [
      '關於「人工智慧對未來工作影響」的高階單字片語與俗諺',
      '關於「現代人焦慮與心理健康」的高分描寫詞彙與金句',
    ],
  },
};

const SCORE_OPTIONS: { id: TargetScore; label: string; desc: string }[] = [
  { id: 'under10', label: '10 分以下 (Foundation)', desc: '基礎打底 · 通順句構與核心詞彙' },
  { id: '11to15', label: '11 ~ 15 分 (Competent)', desc: '進階提升 · 轉折句型與段落銜接' },
  { id: '16to20', label: '16 ~ 20 分 (Advanced)', desc: '高分頂尖 · 頂級修辭與深層立意' },
];

export default function Home() {
  const [mainMode, setMainMode] = useState<MainMode>('guidance');
  const [guidanceType, setGuidanceType] = useState<GuidanceType>('picture');
  const [targetScore, setTargetScore] = useState<TargetScore>('11to15');
  
  const [topic, setTopic] = useState('');
  const [userEssay, setUserEssay] = useState('');
  
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [guidanceResult, setGuidanceResult] = useState<{
    theme: string;
    outline: string;
    vocab: string;
  } | null>(null);

  const [correctionResult, setCorrectionResult] = useState<{
    score: string;
    summary: string;
    errors: string;
    modelEssay: string;
  } | null>(null);

  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData({
          base64: reader.result as string,
          mimeType: file.type,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    const hasPromptSource = topic.trim().length > 0 || fileData !== null;
    if (!hasPromptSource) return;
    if (mainMode === 'correction' && !userEssay.trim()) return;

    setLoading(true);
    setGuidanceResult(null);
    setCorrectionResult(null);

    try {
      const subTypeName = mainMode === 'guidance' ? GUIDANCE_CONFIG[guidanceType].label : '作文批改';
      const filePayload = fileData ? { base64: fileData.base64, mimeType: fileData.mimeType } : undefined;

      const res = await generateEssayHelp(mainMode, subTypeName, targetScore, topic, userEssay, filePayload);

      if (res.error) {
        alert(res.error);
      } else if (res.guidanceResult) {
        setGuidanceResult(res.guidanceResult);
      } else if (res.correctionResult) {
        setCorrectionResult(res.correctionResult);
      }
    } catch (err) {
      alert('系統連線異常，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, sectionId: string) => {
    // 移除 HTML 標籤後複製純文字
    const cleanText = text.replace(/<[^>]*>/g, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const isButtonDisabled =
    loading ||
    (!topic.trim() && !fileData) ||
    (mainMode === 'correction' && !userEssay.trim());

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      
      {/* 🏛️ ETS 風格頂部 Header */}
      <header className="bg-[#0A2540] text-white border-b border-slate-800 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400 text-[#0A2540] font-black text-xl px-2.5 py-0.5 rounded tracking-wider">
              GSAT
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block leading-none">
                Writing Assessment Center
              </span>
              <span className="text-[10px] text-slate-300 tracking-widest uppercase block mt-0.5">
                AI Official Diagnostic System
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <span className="hover:text-white transition cursor-pointer">Evaluation Standards</span>
            <span className="hover:text-white transition cursor-pointer">Rubric Guide</span>
            <span className="px-3 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-300 rounded-full">
              Official Benchmark Mode
            </span>
          </div>
        </div>
      </header>

      {/* 主體內容容器 */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* 標題與簡介卡片 */}
        <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0A2540] tracking-tight">
            大考中心 CEEC 標準英文作文 AI 診斷與評估系統
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            結合多模態視覺比對技術與大考中心閱卷指標，提供學術級作文引導與全文診斷報告。
          </p>
        </div>

        {/* 🏛️ 主分區切換（ETS 頁籤風格） */}
        <div className="flex border-b border-slate-300">
          <button
            onClick={() => {
              setMainMode('guidance');
              setGuidanceResult(null);
              setCorrectionResult(null);
            }}
            className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              mainMode === 'guidance'
                ? 'border-[#0A2540] text-[#0A2540] bg-white rounded-t-lg border-t border-x border-slate-200'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>💡 寫作架構與靈感引導</span>
          </button>
          <button
            onClick={() => {
              setMainMode('correction');
              setGuidanceResult(null);
              setCorrectionResult(null);
            }}
            className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              mainMode === 'correction'
                ? 'border-[#0A2540] text-[#0A2540] bg-white rounded-t-lg border-t border-x border-slate-200'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📝 官方標準全文精細批改</span>
          </button>
        </div>

        {/* 引導區子選單 */}
        {mainMode === 'guidance' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(Object.keys(GUIDANCE_CONFIG) as GuidanceType[]).map((key) => {
              const isActive = guidanceType === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setGuidanceType(key);
                    setTopic('');
                  }}
                  className={`p-3 text-xs font-bold rounded-lg border text-center transition-all ${
                    isActive
                      ? 'bg-[#0A2540] text-white border-[#0A2540] shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {GUIDANCE_CONFIG[key].label}
                </button>
              );
            })}
          </div>
        )}

        {/* 💡 目標分數選擇器 (僅引導區顯示) */}
        {mainMode === 'guidance' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-extrabold text-slate-700 tracking-wider uppercase block">
              選擇學生程度與目標分級 (Target Level)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SCORE_OPTIONS.map((opt) => {
                const isSelected = targetScore === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTargetScore(opt.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-[#0A2540] bg-slate-50 ring-2 ring-[#0A2540]/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`text-sm font-bold ${isSelected ? 'text-[#0A2540]' : 'text-slate-800'}`}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 輸入卡片區 */}
        <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          
          {/* 📎 題目圖片/PDF 上傳區 */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                題目試卷上傳 (Image / PDF Document Upload)
              </label>
              <span className="text-xs text-slate-400">支援 JPG, PNG, PDF 格式</span>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm">
                <span>📎 選擇題目檔案</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {fileData && (
                <div className="flex items-center gap-2.5 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-xs text-slate-800">
                  {fileData.mimeType.includes('image') ? (
                    <img src={fileData.base64} alt="Preview" className="h-7 w-7 object-cover rounded border" />
                  ) : (
                    <span className="font-bold text-rose-600">📄 PDF</span>
                  )}
                  <span className="truncate max-w-[180px] font-medium">{fileData.name}</span>
                  <button
                    onClick={() => setFileData(null)}
                    className="ml-2 text-slate-400 hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 題目文字欄位 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="topic-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {mainMode === 'guidance' ? '作文題目 / 欲發想之情境描述 (Prompt)' : '1. 作文題目描述'}
              </label>
              <span className="text-xs text-slate-400">{topic.length} 字</span>
            </div>
            <textarea
              id="topic-input"
              rows={mainMode === 'correction' ? 2 : 4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                fileData
                  ? '已成功夾帶檔案，系統將自動解析。如有額外說明可填寫於此...'
                  : GUIDANCE_CONFIG[guidanceType].placeholder
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] text-sm transition-all resize-none leading-relaxed"
            />
          </div>

          {/* 批改區：英文內文 */}
          {mainMode === 'correction' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label htmlFor="essay-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. 貼上考生作文內文 (Student Response)
                </label>
                <span className="text-xs text-slate-400">{userEssay.length} 字</span>
              </div>
              <textarea
                id="essay-input"
                rows={9}
                value={userEssay}
                onChange={(e) => setUserEssay(e.target.value)}
                placeholder="Please paste the student's full English essay here for official diagnostic review..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] text-sm transition-all resize-none leading-relaxed font-mono"
              />
            </div>
          )}

          {/* 快速示範按鈕 */}
          {mainMode === 'guidance' && !fileData && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                快速體驗試用範例：
              </span>
              <div className="flex flex-wrap gap-2">
                {GUIDANCE_CONFIG[guidanceType].examples.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTopic(ex)}
                    className="text-xs text-slate-600 hover:text-[#0A2540] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition text-left truncate max-w-xs border border-slate-200"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 按鈕 */}
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className="w-full py-4 bg-[#0A2540] hover:bg-[#081e33] disabled:bg-slate-200 disabled:text-slate-400 font-bold rounded-lg text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                官方診斷模組比對中，請稍候...
              </span>
            ) : mainMode === 'correction' ? (
              '產生官方作文診斷報告 (Start Assessment)'
            ) : (
              '生成學術引導與高分詞彙 (Generate Guidance)'
            )}
          </button>
        </div>

        {/* Loading 狀態 */}
        {loading && (
          <div className="p-8 bg-white border border-slate-200 rounded-xl space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
              <div className="h-4 bg-slate-100 rounded w-4/6"></div>
            </div>
          </div>
        )}

        {/* 💡 靈感引導結果展示區（完全無符號，彩色 HTML 渲染） */}
        {guidanceResult && !loading && (
          <div className="space-y-6">
            
            {/* 🟢 核心主題與破題 */}
            {guidanceResult.theme && (
              <div className="p-6 md:p-8 bg-white border-l-4 border-l-emerald-500 border-y border-r border-slate-200 rounded-r-xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    SECTION 1: THESIS & FRAMING
                  </span>
                  <button
                    onClick={() => handleCopy(guidanceResult.theme, 'theme')}
                    className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                  >
                    {copiedSection === 'theme' ? '已複製純文字' : '複製內容'}
                  </button>
                </div>
                <div
                  className="prose prose-slate max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: guidanceResult.theme }}
                />
              </div>
            )}

            {/* 🔵 段落大綱與句型 */}
            {guidanceResult.outline && (
              <div className="p-6 md:p-8 bg-white border-l-4 border-l-sky-500 border-y border-r border-slate-200 rounded-r-xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded">
                    SECTION 2: OUTLINE & STRUCTURES
                  </span>
                  <button
                    onClick={() => handleCopy(guidanceResult.outline, 'outline')}
                    className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                  >
                    {copiedSection === 'outline' ? '已複製純文字' : '複製內容'}
                  </button>
                </div>
                <div
                  className="prose prose-slate max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: guidanceResult.outline }}
                />
              </div>
            )}

            {/* 🟣 高分詞彙與俗諺 */}
            {guidanceResult.vocab && (
              <div className="p-6 md:p-8 bg-white border-l-4 border-l-purple-500 border-y border-r border-slate-200 rounded-r-xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded">
                    SECTION 3: LEXICAL RESOURCE & QUOTES
                  </span>
                  <button
                    onClick={() => handleCopy(guidanceResult.vocab, 'vocab')}
                    className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                  >
                    {copiedSection === 'vocab' ? '已複製純文字' : '複製單字庫'}
                  </button>
                </div>
                <div
                  className="prose prose-slate max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: guidanceResult.vocab }}
                />
              </div>
            )}

          </div>
        )}

        {/* 📝 批改結果展示區（ETS 官方 Score Card 風格） */}
        {correctionResult && !loading && (
          <div className="space-y-6">
            
            {/* 總評與分數卡片 */}
            <div className="p-6 md:p-8 bg-white border-l-4 border-l-[#0A2540] border-y border-r border-slate-200 rounded-r-xl shadow-md space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
                <div>
                  <span className="text-[11px] font-extrabold text-[#0A2540] tracking-widest uppercase block">
                    Official Scale Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-5xl font-black text-[#0A2540]">{correctionResult.score}</span>
                    <span className="text-slate-400 text-sm font-semibold">/ 20.0</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(correctionResult.summary, 'summary')}
                  className="self-start md:self-center px-4 py-2 bg-[#0A2540] hover:bg-[#081e33] text-white text-xs font-bold rounded transition shadow-sm"
                >
                  {copiedSection === 'summary' ? '已複製完整報告' : '複製診斷報告'}
                </button>
              </div>

              <div
                className="prose prose-slate max-w-none text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: correctionResult.summary }}
              />
            </div>

            {/* 🔴 文法用語錯誤對照 */}
            {correctionResult.errors && (
              <div className="p-6 md:p-8 bg-white border-l-4 border-l-rose-500 border-y border-r border-slate-200 rounded-r-xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded">
                    DIAGNOSTICS: GRAMMAR & USAGE CORRECTIONS
                  </span>
                  <button
                    onClick={() => handleCopy(correctionResult.errors, 'errors')}
                    className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                  >
                    {copiedSection === 'errors' ? '已複製錯誤對照' : '複製對照表'}
                  </button>
                </div>
                <div
                  className="prose prose-slate max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: correctionResult.errors }}
                />
              </div>
            )}

            {/* 🌲 示範範文 */}
            {correctionResult.modelEssay && (
              <div className="p-6 md:p-8 bg-slate-900 text-slate-100 rounded-xl shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded">
                    BENCHMARK MODEL RESPONSE (BAND 16+)
                  </span>
                  <button
                    onClick={() => handleCopy(correctionResult.modelEssay, 'model')}
                    className="text-xs px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
                  >
                    {copiedSection === 'model' ? '已複製範文' : '複製範文'}
                  </button>
                </div>
                <div
                  className="prose prose-invert max-w-none text-sm leading-relaxed font-serif"
                  dangerouslySetInnerHTML={{ __html: correctionResult.modelEssay }}
                />
              </div>
            )}

          </div>
        )}

      </main>

      {/* 🏛️ 頁腳 Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16 py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-6 space-y-2">
          <p className="font-semibold text-slate-600">
            GSAT & CEEC English Writing Assessment System
          </p>
          <p>© 2026 Assessment Hub. All rights reserved. Built with Multimodal Assessment Standards.</p>
        </div>
      </footer>

    </div>
  );
}