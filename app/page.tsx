'use client';

import { useState } from 'react';
import { generateEssayHelp } from './actions';

type MainMode = 'guidance' | 'correction';
type GuidanceType = 'picture' | 'chart' | 'essay' | 'vocab';
type TargetScore = 'under10' | '11to15' | '16to20';

const GUIDANCE_CONFIG: Record<GuidanceType, { label: string; placeholder: string; examples: string[] }> = {
  picture: {
    label: '看圖寫作',
    placeholder: '可直接上傳四格漫畫圖片/PDF，或輸入文字描述...',
    examples: [
      '第一張圖主角在排隊買限量商品，第二張圖突然有人插隊...',
      '第一張圖大家在公園野餐，第二張圖突然下大雨...',
    ],
  },
  chart: {
    label: '圖表分析',
    placeholder: '可直接上傳圖表圖片/PDF，或輸入數據趨勢...',
    examples: [
      '描述 2010 年至 2020 年台灣青少年使用社群媒體的時間變化...',
      '比較高中生選擇打工與參加社團的比例變化...',
    ],
  },
  essay: {
    label: '主題論述',
    placeholder: '輸入作文題目、貼上題目卷 PDF，或描述核心話題...',
    examples: [
      '討論高中生是否應該被禁止攜帶智慧型手機到學校...',
      '面對失敗與挫折時，你認為最重要的心態是什麼？',
    ],
  },
  vocab: {
    label: '單字片語發想',
    placeholder: '輸入你想寫的主題或上傳文章題目...',
    examples: [
      '關於「人工智慧對未來工作影響」的高級單字片語與俗諺',
      '關於「現代人焦慮與心理健康」的高分描寫詞彙與金句',
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
  
  // 檔案狀態 (圖片 / PDF)
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // 引導結果
  const [guidanceResult, setGuidanceResult] = useState<{
    theme: string;
    outline: string;
    vocab: string;
  } | null>(null);

  // 批改結果
  const [correctionResult, setCorrectionResult] = useState<{
    score: string;
    summary: string;
    errors: string;
    modelEssay: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  // 檔案上傳處理 (圖片 & PDF)
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
    // 條件：必須有 (題目文字 OR 檔案)，且批改模式下必須有 userEssay
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

  // 能否提交按鈕的判斷邏輯
  const isButtonDisabled =
    loading ||
    (!topic.trim() && !fileData) ||
    (mainMode === 'correction' && !userEssay.trim());

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
            支援圖片與 PDF 題目卷深度解析、分層級靈感引導與大考中心（CEEC）標準精準批改。
          </p>
        </header>

        {/* 主分區：引導區 vs 批改區 */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/60">
          <button
            onClick={() => {
              setMainMode('guidance');
              setGuidanceResult(null);
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
              setGuidanceResult(null);
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

        {/* 引導區專屬子選單 */}
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

        {/* 💡 靈感引導區：目標分數選擇器 */}
        {mainMode === 'guidance' && (
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
        )}

        {/* 輸入區塊 */}
        <div className="space-y-5 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* 📎 圖片 / PDF 檔案上傳區 */}
          <div className="space-y-2 pb-2">
            <label className="text-sm font-semibold text-slate-700 block">
              上傳題目圖片或 PDF 題目卷（上傳後可不填文字）
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-2">
                <span>📎 選擇檔案 (JPG, PNG, PDF)</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* 檔案預覽/標示 */}
              {fileData && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-800">
                  {fileData.mimeType.includes('image') ? (
                    <img src={fileData.base64} alt="Preview" className="h-8 w-8 object-cover rounded border" />
                  ) : (
                    <span className="font-bold">📄 PDF</span>
                  )}
                  <span className="truncate max-w-[150px]">{fileData.name}</span>
                  <button
                    onClick={() => setFileData(null)}
                    className="ml-1 text-rose-500 font-bold hover:text-rose-700"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 題目欄位 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
              <label htmlFor="topic-input">
                {mainMode === 'guidance' ? '作文題目 / 欲發想的情境描述（可選填）' : '1. 作文題目描述（若已上傳檔案可選填）'}
              </label>
              <span className="text-xs text-slate-400 font-normal">{topic.length} 字</span>
            </div>
            <textarea
              id="topic-input"
              rows={mainMode === 'correction' ? 2 : 4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                fileData
                  ? '已上傳檔案，AI 將自動辨識內容；如有補充說明可寫在此處...'
                  : GUIDANCE_CONFIG[guidanceType].placeholder
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all resize-none leading-relaxed"
            />
          </div>

          {/* 批改區：英文內文輸入欄 */}
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
          {mainMode === 'guidance' && !fileData && (
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

          {/* 生成按鈕 */}
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 font-bold rounded-xl text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mainMode === 'correction' ? '圖片/PDF 精細解析與作文批改中...' : '圖片/PDF 深度閱讀與靈感生成中...'}
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

        {/* 💡 靈感引導結果展示區 */}
        {guidanceResult && !loading && (
          <div className="space-y-6">
            
            {/* 🟢 破題與主題立意 (翠綠框) */}
            {guidanceResult.theme && (
              <div className="p-6 md:p-8 bg-emerald-50/50 border-2 border-emerald-500 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-200 pb-3">
                  <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                    🟢 核心主題與破題立意建議
                  </h3>
                  <button
                    onClick={() => handleCopy(guidanceResult.theme)}
                    className="text-xs px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium transition"
                  >
                    複製內容
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">
                  {guidanceResult.theme}
                </div>
              </div>
            )}

            {/* 藍 段落大綱與句型 (湛藍框) */}
            {guidanceResult.outline && (
              <div className="p-6 md:p-8 bg-sky-50/50 border-2 border-sky-500 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-sky-200 pb-3">
                  <h3 className="text-lg font-bold text-sky-900 flex items-center gap-2">
                    🔵 段落大綱與必備句型
                  </h3>
                  <button
                    onClick={() => handleCopy(guidanceResult.outline)}
                    className="text-xs px-2.5 py-1 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 font-medium transition"
                  >
                    複製內容
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">
                  {guidanceResult.outline}
                </div>
              </div>
            )}

            {/* 🟣 單字片語與俗諺 (紫色框) */}
            {guidanceResult.vocab && (
              <div className="p-6 md:p-8 bg-purple-50/50 border-2 border-purple-500 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-purple-200 pb-3">
                  <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                    🟣 高分關鍵單字、片語與萬用俗諺
                  </h3>
                  <button
                    onClick={() => handleCopy(guidanceResult.vocab)}
                    className="text-xs px-2.5 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium transition"
                  >
                    複製單字庫
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">
                  {guidanceResult.vocab}
                </div>
              </div>
            )}

          </div>
        )}

        {/* 📝 作文批改結果展示區 */}
        {correctionResult && !loading && (
          <div className="space-y-6">
            <div className="p-6 md:p-8 bg-emerald-50/50 border-2 border-emerald-500 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-emerald-200 pb-4 gap-2">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                    CEEC 大考中心標準預估得分
                  </span>
                  <div className="text-4xl md:text-5xl font-black text-emerald-800 mt-1">
                    {correctionResult.score}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(correctionResult.summary)}
                  className="self-start md:self-center text-xs px-3 py-1.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition"
                >
                  複製總評報告
                </button>
              </div>

              <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">
                {correctionResult.summary}
              </div>
            </div>

            {correctionResult.errors && (
              <div className="p-6 md:p-8 bg-rose-50/50 border-2 border-rose-500 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-rose-200 pb-3">
                  <h3 className="text-lg font-bold text-rose-900 flex items-center gap-2">
                    🔴 文法、用語與標點符號修正
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

            {correctionResult.modelEssay && (
              <div className="p-6 md:p-8 bg-emerald-950/5 border-2 border-emerald-800 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-800/20 pb-3">
                  <h3 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                    🌲 高分示範範文 (Model Essay)
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