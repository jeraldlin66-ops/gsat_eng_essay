'use client';

import { useState } from 'react';
import { generateEssayHelp } from './actions';

type MainMode = 'guidance' | 'correction';
type GuidanceType = 'picture' | 'chart' | 'essay' | 'vocab';
type TargetScore = 'under10' | '11to15' | '16to20';

const GUIDANCE_CONFIG: Record<GuidanceType, { label: string; placeholder: string; examples: string[] }> = {
  picture: {
    label: '看圖寫作',
    placeholder: '可上傳學測四格漫畫題目卷（JPG/PDF），或輸入情境描述...',
    examples: [
      '第一張圖主角在排隊買限量商品，第二張圖突然有人插隊...',
      '第一張圖大家在公園野餐，第二張圖突然下大雨...',
    ],
  },
  chart: {
    label: '圖表說明',
    placeholder: '可上傳統計圖表題目卷，或描述數據趨勢與項目比較...',
    examples: [
      '描述 2015 年至 2025 年高中生每日使用社群媒體時間變化...',
      '比較高中生選擇自主學習與參加社團的比例與主要原因...',
    ],
  },
  essay: {
    label: '主題論述',
    placeholder: '輸入學測寫作題目、上傳題目卷，或描述引導文字...',
    examples: [
      '討論高中生是否應該被禁止攜帶智慧型手機到校...',
      '面對失敗與挫折時，你認為最重要的心態與因應作法...',
    ],
  },
  vocab: {
    label: '常用詞彙與句型發想',
    placeholder: '輸入主題關鍵字（例如：環境永續、心理健康、人工智慧）...',
    examples: [
      '關於「氣候變遷與減碳行動」的高分詞彙與名言佳句',
      '關於「青少年人際關係與壓力緩解」的描寫詞彙與句型',
    ],
  },
};

const SCORE_OPTIONS: { id: TargetScore; label: string; desc: string }[] = [
  { id: 'under10', label: '10 分以下（基礎打底）', desc: '著重基本句型完整度、常用連詞與核心詞彙' },
  { id: '11to15', label: '11 – 15 分（進階提升）', desc: '著重段落轉折銜接、複合句型與道地詞彙' },
  { id: '16to20', label: '16 – 20 分（高分標竿）', desc: '著重精妙破題切入、高級修辭與深層立意' },
];

export default function Home() {
  const [mainMode, setMainMode] = useState<MainMode>('correction');
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
      const subTypeName = mainMode === 'guidance' ? GUIDANCE_CONFIG[guidanceType].label : '作文評量';
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
      alert('評量系統連線異常，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, sectionId: string) => {
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
    <div className="min-h-screen bg-[#F7F5EF] text-[#111111] font-sans antialiased selection:bg-[#2F5D50]/20">
      
      {/* 🏛️ 頂部 Academic Navbar */}
      <header className="bg-[#1E3A5F] text-white border-b border-[#132742]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-[#2F5D50] text-white font-bold text-xs px-2.5 py-1 rounded tracking-wide border border-white/20">
              CEEC Standard
            </span>
            <div>
              <span className="font-bold text-base md:text-lg tracking-tight block leading-none font-[#IBM Plex Sans]">
                學測英文作文評量中心
              </span>
              <span className="text-[10px] text-slate-300 tracking-wider block mt-0.5">
                College Entrance Examination Center Assessment System
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-200">
            <a href="#rubric" className="hover:text-white transition">CEEC 評分規準</a>
            <a href="#steps" className="hover:text-white transition">評量流程指南</a>
            <a href="#faq" className="hover:text-white transition">常見失誤分析</a>
          </div>
        </div>
      </header>

      {/* 🏛️ 官方 Hero 區塊 */}
      <section className="bg-white border-b border-slate-300 py-10 md:py-14 px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F7F5EF] border border-slate-300 rounded text-xs text-[#1E3A5F] font-semibold">
            🎓 模擬真實大考閱卷流程 · 依據 CEEC 官方四維度規準
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-[#1E3A5F] tracking-tight leading-tight">
            依據學測評分標準，提供精準診斷與高分寫作建議
          </h1>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed max-w-3xl">
            上傳作文題目卷或輸入內文，系統將依據大考中心「內容、組織、文法句構、字彙拼字」四大維度進行客觀模擬閱卷，提供逐句修正對照、得分分析與高分範例比對。
          </p>
          
          {/* 數據信任標籤 */}
          <div className="pt-3 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-200 text-xs text-slate-600">
            <div><span className="font-bold text-[#1E3A5F] text-sm block">100% 依循</span>CEEC 大考規準</div>
            <div><span className="font-bold text-[#1E3A5F] text-sm block">4 大維度</span>獨立分項計分</div>
            <div><span className="font-bold text-[#1E3A5F] text-sm block">逐句修訂</span>語法與拼字對照</div>
            <div><span className="font-bold text-[#1E3A5F] text-sm block">標竿範文</span>16+ 高分結構示範</div>
          </div>
        </div>
      </section>

      {/* 📌 四步驟流程 (Step 1 -> Step 4) */}
      <section id="steps" className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-[#EBF2EE] border border-[#2F5D50]/30 rounded-lg p-4 md:p-5">
          <span className="text-xs font-bold text-[#2F5D50] uppercase tracking-wider block mb-2">
            評量操作流程 (Assessment Steps)
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="font-bold text-[#1E3A5F] block mb-0.5">Step 1. 選擇模式</span>
              全文評量 或 高分引導
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="font-bold text-[#1E3A5F] block mb-0.5">Step 2. 提供題目</span>
              上傳試卷檔案 或 描述
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="font-bold text-[#1E3A5F] block mb-0.5">Step 3. 輸入作文</span>
              貼上學生英文文章內文
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="font-bold text-[#2F5D50] block mb-0.5">Step 4. 取得報告</span>
              分項成績與逐句診斷
            </div>
          </div>
        </div>
      </section>

      {/* 主體作業區域 */}
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-8">

        {/* 模式切換（深藍色學術頁籤） */}
        <div className="flex border-b-2 border-[#1E3A5F]">
          <button
            onClick={() => {
              setMainMode('correction');
              setGuidanceResult(null);
              setCorrectionResult(null);
            }}
            className={`px-6 py-3 text-sm font-bold transition-all ${
              mainMode === 'correction'
                ? 'bg-[#1E3A5F] text-white rounded-t'
                : 'bg-white text-slate-600 hover:text-slate-900 border-t border-x border-slate-300'
            }`}
          >
            📝 官方標準作文全文評量
          </button>
          <button
            onClick={() => {
              setMainMode('guidance');
              setGuidanceResult(null);
              setCorrectionResult(null);
            }}
            className={`px-6 py-3 text-sm font-bold transition-all ${
              mainMode === 'guidance'
                ? 'bg-[#1E3A5F] text-white rounded-t'
                : 'bg-white text-slate-600 hover:text-slate-900 border-t border-x border-slate-300'
            }`}
          >
            💡 高分作文架構與表達引導
          </button>
        </div>

        {/* 引導區子分類 */}
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
                  className={`p-2.5 text-xs font-bold rounded border text-center transition ${
                    isActive
                      ? 'bg-[#2F5D50] text-white border-[#2F5D50]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {GUIDANCE_CONFIG[key].label}
                </button>
              );
            })}
          </div>
        )}

        {/* 目標分數選擇器 */}
        {mainMode === 'guidance' && (
          <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm space-y-2">
            <label className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider block">
              選擇學生目前程度與評量目標 (Target Band)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SCORE_OPTIONS.map((opt) => {
                const isSelected = targetScore === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTargetScore(opt.id)}
                    className={`p-3 rounded border text-left transition ${
                      isSelected
                        ? 'border-[#2F5D50] bg-[#EBF2EE] text-[#2F5D50]'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] text-slate-600 mt-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 輸入卡片區 */}
        <div className="bg-white p-6 md:p-8 rounded-lg border border-slate-300 shadow-sm space-y-5">
          
          {/* 上傳檔案 */}
          <div className="space-y-2 pb-3 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider block">
                1. 上傳題目卷或圖表檔案 (PDF / JPG / PNG)
              </label>
              <span className="text-[11px] text-slate-500">可選填，上傳後系統將直接解讀試卷</span>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3.5 py-2 bg-[#F7F5EF] hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold transition flex items-center gap-2">
                <span>📎 選擇題目檔案</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {fileData && (
                <div className="flex items-center gap-2 bg-[#EBF2EE] border border-[#2F5D50]/40 px-3 py-1 rounded text-xs text-[#2F5D50]">
                  <span className="font-bold">📄 已夾帶試卷：</span>
                  <span className="truncate max-w-[180px]">{fileData.name}</span>
                  <button
                    onClick={() => setFileData(null)}
                    className="ml-2 text-rose-600 font-bold hover:text-rose-800"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 題目描述 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="topic-input" className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider">
                {mainMode === 'guidance' ? '2. 作文題目 / 情境說明' : '2. 作文題目描述（若已上傳檔案可免填）'}
              </label>
            </div>
            <textarea
              id="topic-input"
              rows={mainMode === 'correction' ? 2 : 3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                fileData
                  ? '已上傳試卷檔案，系統將自動解析；若有額外補充可填寫於此...'
                  : GUIDANCE_CONFIG[guidanceType].placeholder
              }
              className="w-full bg-[#F7F5EF] border border-slate-300 rounded p-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#1E3A5F] text-xs leading-relaxed resize-none"
            />
          </div>

          {/* 作文全文 (僅評量模式) */}
          {mainMode === 'correction' && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <label htmlFor="essay-input" className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider">
                  3. 輸入學生英文作文全文 (Student Essay)
                </label>
                <span className="text-[11px] text-slate-400">{userEssay.length} 字</span>
              </div>
              <textarea
                id="essay-input"
                rows={9}
                value={userEssay}
                onChange={(e) => setUserEssay(e.target.value)}
                placeholder="請在此貼上學生英文作文全文，系統將依據大考中心標準進行全方位診斷..."
                className="w-full bg-[#F7F5EF] border border-slate-300 rounded p-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#1E3A5F] text-xs leading-relaxed font-mono resize-none"
              />
            </div>
          )}

          {/* 按鈕 */}
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className="w-full py-3.5 bg-[#1E3A5F] hover:bg-[#132742] disabled:bg-slate-300 disabled:text-slate-500 font-bold rounded text-white text-xs tracking-wider transition duration-150 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                依據 CEEC 評分規準分析中，請稍候...
              </span>
            ) : mainMode === 'correction' ? (
              '開始執行作文評量與診斷報告'
            ) : (
              '產生高分寫作引導與詞彙庫'
            )}
          </button>
        </div>

        {/* 結果展示：高分引導 */}
        {guidanceResult && !loading && (
          <div className="space-y-5">
            {guidanceResult.theme && (
              <div className="p-6 bg-white border-l-4 border-l-[#2F5D50] border-y border-r border-slate-300 rounded-r shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-[#2F5D50] uppercase tracking-wider">
                    一、 審題立意與破題切入
                  </span>
                  <button
                    onClick={() => handleCopy(guidanceResult.theme, 'theme')}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-300"
                  >
                    {copiedSection === 'theme' ? '已複製純文字' : '複製內容'}
                  </button>
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: guidanceResult.theme }} />
              </div>
            )}

            {guidanceResult.outline && (
              <div className="p-6 bg-white border-l-4 border-l-[#1E3A5F] border-y border-r border-slate-300 rounded-r shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider">
                    二、 段落發展與建議句型
                  </span>
                  <button
                    onClick={() => handleCopy(guidanceResult.outline, 'outline')}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-300"
                  >
                    {copiedSection === 'outline' ? '已複製純文字' : '複製內容'}
                  </button>
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: guidanceResult.outline }} />
              </div>
            )}

            {guidanceResult.vocab && (
              <div className="p-6 bg-white border-l-4 border-l-amber-600 border-y border-r border-slate-300 rounded-r shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    三、 推薦高分詞彙與表達補給
                  </span>
                  <button
                    onClick={() => handleCopy(guidanceResult.vocab, 'vocab')}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-300"
                  >
                    {copiedSection === 'vocab' ? '已複製純文字' : '複製詞彙庫'}
                  </button>
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: guidanceResult.vocab }} />
              </div>
            )}
          </div>
        )}

        {/* 結果展示：全文評量報告 */}
        {correctionResult && !loading && (
          <div className="space-y-6">
            
            {/* 總分與評分卡片 */}
            <div className="p-6 md:p-8 bg-white border-l-4 border-l-[#1E3A5F] border-y border-r border-slate-300 rounded-r shadow-md space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-[#1E3A5F] uppercase tracking-wider block">
                    CEEC 標準預估總分
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl md:text-5xl font-black text-[#1E3A5F] font-mono">
                      {correctionResult.score}
                    </span>
                    <span className="text-xs text-slate-500">/ 20.0 分</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(correctionResult.summary, 'summary')}
                  className="px-3 py-1.5 bg-[#1E3A5F] text-white text-xs font-bold rounded hover:bg-[#132742] transition"
                >
                  {copiedSection === 'summary' ? '已複製診斷報告' : '複製完整診斷報告'}
                </button>
              </div>

              <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: correctionResult.summary }} />
            </div>

            {/* 逐句診斷與修訂對照 */}
            {correctionResult.errors && (
              <div className="p-6 bg-white border-l-4 border-l-rose-600 border-y border-r border-slate-300 rounded-r shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                    三、 逐句語法與用語修訂對照
                  </span>
                  <button
                    onClick={() => handleCopy(correctionResult.errors, 'errors')}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-300"
                  >
                    {copiedSection === 'errors' ? '已複製純文字' : '複製對照表'}
                  </button>
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: correctionResult.errors }} />
              </div>
            )}

            {/* 高分範文 */}
            {correctionResult.modelEssay && (
              <div className="p-6 bg-[#1E3A5F] text-white rounded shadow-md space-y-3">
                <div className="flex justify-between items-center border-b border-slate-600 pb-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    四、 16+ 高分標竿示範範文
                  </span>
                  <button
                    onClick={() => handleCopy(correctionResult.modelEssay, 'model')}
                    className="text-xs px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 font-semibold rounded border border-white/20"
                  >
                    {copiedSection === 'model' ? '已複製範文' : '複製標竿範文'}
                  </button>
                </div>
                <div className="text-xs leading-relaxed font-serif text-slate-100" dangerouslySetInnerHTML={{ __html: correctionResult.modelEssay }} />
              </div>
            )}

          </div>
        )}

        {/* 📚 CEEC 評分規準說明區塊 */}
        <section id="rubric" className="bg-white p-6 md:p-8 rounded-lg border border-slate-300 space-y-4">
          <h3 className="text-base font-bold text-[#1E3A5F] border-b border-slate-200 pb-2">
            CEEC 大考中心英文作文評分維度說明
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
            <div className="p-3 bg-[#F7F5EF] rounded border border-slate-200">
              <span className="font-bold text-[#1E3A5F] block mb-1">1. 內容 (Content) - 5分</span>
              評估主題發揮是否切題、情境發展是否完整連貫、細節描繪是否豐富且符合題意。
            </div>
            <div className="p-3 bg-[#F7F5EF] rounded border border-slate-200">
              <span className="font-bold text-[#1E3A5F] block mb-1">2. 組織 (Organization) - 5分</span>
              評估文章結構（引言、發展、結論）是否完整，段落銜接與轉折詞運用是否順暢。
            </div>
            <div className="p-3 bg-[#F7F5EF] rounded border border-slate-200">
              <span className="font-bold text-[#1E3A5F] block mb-1">3. 文法句構 (Grammar & Structures) - 5分</span>
              評估句型變化多樣性（如倒裝句、分詞構句），以及時態、單複數等文法精準度。
            </div>
            <div className="p-3 bg-[#F7F5EF] rounded border border-slate-200">
              <span className="font-bold text-[#1E3A5F] block mb-1">4. 字彙拼字 (Vocabulary & Spelling) - 5分</span>
              評估用詞精準度與豐富度（高階詞彙），以及拼字與大小寫標點符號之正確性。
            </div>
          </div>
        </section>

      </main>

      {/* 🏛️ Footer */}
      <footer className="border-t border-slate-300 bg-white py-8 text-center text-xs text-slate-600">
        <div className="max-w-4xl mx-auto px-6 space-y-2">
          <p className="font-bold text-[#1E3A5F]">學測英文作文評量中心 · CEEC Evaluation Standards Benchmark</p>
          <p className="text-[11px] text-slate-500">本平台評量標準參考財團法人大學入學考試中心基金會（CEEC）公布之英文考科非選擇題閱卷標準。</p>
        </div>
      </footer>

    </div>
  );
}