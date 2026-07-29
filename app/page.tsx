'use client';

import { useState } from 'react';
import { generateEssayHelp } from './actions';

type MainMode = 'correction' | 'guidance';
type GuidanceType = 'picture' | 'chart' | 'essay' | 'vocab';
type TargetScore = 'under10' | '11to15' | '16to20';

const GUIDANCE_CONFIG: Record<GuidanceType, { label: string; placeholder: string }> = {
  picture: {
    label: '看圖寫作',
    placeholder: '上傳學測四格漫畫試卷（PDF / JPG），或輸入圖片情境細節描述...',
  },
  chart: {
    label: '圖表說明',
    placeholder: '上傳統計圖表試卷，或輸入數據趨勢與比較項目...',
  },
  essay: {
    label: '主題論述',
    placeholder: '輸入學測作文題目、引導文字，或描述論述核心觀點...',
  },
  vocab: {
    label: '單字與片語建議',
    placeholder: '輸入寫作主題關鍵字（例如：氣候變遷、青少年壓力、AI 發展應用）...',
  },
};

const SCORE_OPTIONS: { id: TargetScore; label: string; desc: string }[] = [
  { id: 'under10', label: '10 分以下 · 基礎打底', desc: '著重基本句型完整度與核心詞彙，降低語法錯誤率' },
  { id: '11to15', label: '11 – 15 分 · 進階提升', desc: '強化段落銜接、複合句型與道地詞彙搭配' },
  { id: '16to20', label: '16 – 20 分 · 高分標竿', desc: '精準破題、修辭手法與深度立意發展' },
];

export default function Home() {
  const [mainMode, setMainMode] = useState<MainMode>('correction');
  const [guidanceType, setGuidanceType] = useState<GuidanceType>('picture');
  const [targetScore, setTargetScore] = useState<TargetScore>('11to15');
  
  const [topic, setTopic] = useState('');
  const [userEssay, setUserEssay] = useState('');
  
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileData({
        base64: reader.result as string,
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
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
      alert('系統評量請求失敗，請稍後重試。');
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled =
    loading ||
    (!topic.trim() && !fileData) ||
    (mainMode === 'correction' && !userEssay.trim());

  return (
    <div className="min-h-screen bg-[#FCFCFB] text-[#0F172A] selection:bg-[#2563EB]/10 selection:text-[#2563EB]">
      
      {/* 🏛️ 頂部導覽 (Notion / Linear 簡潔風格) */}
      <header className="sticky top-0 z-50 bg-[#FCFCFB]/80 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2563EB] rounded-xl flex items-center justify-center font-heading font-bold text-white text-sm">
              E
            </div>
            <span className="font-heading font-bold text-base tracking-tight text-[#0F172A]">
              CEEC Essay Assessment
            </span>
          </div>

          <nav className="flex items-center gap-8 text-xs font-medium text-[#475569]">
            <a href="#workflow" className="hover:text-[#2563EB] transition-colors duration-200">閱卷流程</a>
            <a href="#rubric" className="hover:text-[#2563EB] transition-colors duration-200">評分規準</a>
            <a href="#analysis" className="hover:text-[#2563EB] transition-colors duration-200">失誤分析</a>
          </nav>
        </div>
      </header>

      {/* 🚀 Hero 區塊 (大字重標題 + 左對齊 + 120px 充足留白 + 淡漸層) */}
      <section className="bg-gradient-to-b from-[#F8FAFC] to-[#FFFFFF] border-b border-[#E5E7EB] py-28 md:py-32 px-6 md:px-10 animate-premium-fade">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-[720px] space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#E5E7EB] rounded-full edtech-shadow-sm text-xs font-semibold text-[#2563EB]">
              <span>CEEC 標準 · 大考中心英文作文評量規準</span>
            </div>

            <h1 className="font-heading font-bold text-4xl sm:text-5xl md:text-[60px] text-[#0F172A] leading-[1.08] tracking-tight">
              學測英文作文，不只批改，更教你怎麼拿高分。
            </h1>

            <p className="text-[#475569] text-lg md:text-[19px] font-normal leading-relaxed max-w-[600px]">
              上傳題目、輸入作文，立即獲得符合 CEEC 評分邏輯的分項評分、修改建議與高分範文。
            </p>

          </div>
        </div>
      </section>

      {/* 📌 閱卷流程 (Sequential Staggered Reveal) */}
      <section id="workflow" className="max-w-6xl mx-auto px-6 md:px-10 -mt-10 z-10 relative animate-premium-fade">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 md:p-6 edtech-shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            
            <div className="step-reveal-1 p-4 rounded-2xl border border-[#E5E7EB] bg-white premium-card-transition hover:edtech-shadow-hover">
              <span className="font-heading font-semibold text-[11px] text-[#2563EB] uppercase tracking-wider block">01 / Step</span>
              <span className="font-heading font-semibold text-sm text-[#0F172A] block mt-1">選擇題型</span>
              <span className="text-xs text-[#475569] block mt-0.5">看圖 / 圖表 / 主題論述</span>
            </div>

            <div className="step-reveal-2 p-4 rounded-2xl border border-[#E5E7EB] bg-white premium-card-transition hover:edtech-shadow-hover">
              <span className="font-heading font-semibold text-[11px] text-[#2563EB] uppercase tracking-wider block">02 / Step</span>
              <span className="font-heading font-semibold text-sm text-[#0F172A] block mt-1">上傳題目</span>
              <span className="text-xs text-[#475569] block mt-0.5">PDF、圖片或試卷描述</span>
            </div>

            <div className="step-reveal-3 p-4 rounded-2xl border border-[#E5E7EB] bg-white premium-card-transition hover:edtech-shadow-hover">
              <span className="font-heading font-semibold text-[11px] text-[#2563EB] uppercase tracking-wider block">03 / Step</span>
              <span className="font-heading font-semibold text-sm text-[#0F172A] block mt-1">輸入作文</span>
              <span className="text-xs text-[#475569] block mt-0.5">貼上學生英文寫作內容</span>
            </div>

            <div className="step-reveal-4 p-4 rounded-2xl border border-[#E5E7EB] bg-white premium-card-transition hover:edtech-shadow-hover">
              <span className="font-heading font-semibold text-[11px] text-[#0EA5A4] uppercase tracking-wider block">04 / Step</span>
              <span className="font-heading font-semibold text-sm text-[#0F172A] block mt-1">取得評分報告</span>
              <span className="text-xs text-[#475569] block mt-0.5">四大維度得分與修訂</span>
            </div>

          </div>
        </div>
      </section>

      {/* 💻 主要功能區域 */}
      <main className="max-w-6xl mx-auto px-6 md:px-10 py-12 space-y-8">

        {/* 模式切換 Segment Control */}
        <div className="flex bg-[#F8FAFC] border border-[#E5E7EB] p-1.5 rounded-2xl max-w-md mx-auto">
          <button
            onClick={() => {
              setMainMode('correction');
              setGuidanceResult(null);
              setCorrectionResult(null);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
              mainMode === 'correction'
                ? 'bg-white text-[#0F172A] edtech-shadow-sm'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            作文評量 (Assessment)
          </button>
          <button
            onClick={() => {
              setMainMode('guidance');
              setGuidanceResult(null);
              setCorrectionResult(null);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
              mainMode === 'guidance'
                ? 'bg-white text-[#0F172A] edtech-shadow-sm'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            寫作發想 (Guidance)
          </button>
        </div>

        {/* 題型選擇按鈕 */}
        {mainMode === 'guidance' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-premium-fade">
            {(Object.keys(GUIDANCE_CONFIG) as GuidanceType[]).map((key) => {
              const isActive = guidanceType === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setGuidanceType(key);
                    setTopic('');
                  }}
                  className={`p-3.5 text-xs font-semibold rounded-2xl border text-center premium-card-transition hover:edtech-shadow-hover ${
                    isActive
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-[#475569] border-[#E5E7EB] hover:border-slate-300'
                  }`}
                >
                  {GUIDANCE_CONFIG[key].label}
                </button>
              );
            })}
          </div>
        )}

        {/* 程度目標選取卡片 */}
        {mainMode === 'guidance' && (
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] edtech-shadow-sm space-y-4 animate-premium-fade">
            <span className="font-heading font-semibold text-xs text-[#0F172A] uppercase tracking-wider block">
              設定目標級分 (Target Band)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {SCORE_OPTIONS.map((opt) => {
                const isSelected = targetScore === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTargetScore(opt.id)}
                    className={`p-4 rounded-2xl border text-left premium-card-transition hover:edtech-shadow-hover ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#2563EB]/[0.03] text-[#0F172A]'
                        : 'border-[#E5E7EB] bg-white'
                    }`}
                  >
                    <div className="font-heading font-semibold text-xs text-[#0F172A]">{opt.label}</div>
                    <div className="text-xs text-[#475569] mt-1.5 leading-relaxed">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 📥 主要 Form 卡片（大型 24px 圓角 + 充足 Padding） */}
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-[#E5E7EB] edtech-shadow-sm space-y-8 animate-premium-fade">
          
          {/* 1. 上傳區域（大型獨立焦點卡片） */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-heading font-semibold text-xs text-[#0F172A] uppercase tracking-wider">
                1. 題目卷檔案 (PDF / JPG / PNG)
              </label>
              <span className="text-[11px] text-[#475569]">可直接拖曳檔案至此區域</span>
            </div>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-8 border border-dashed rounded-2xl text-center premium-card-transition ${
                isDragging
                  ? 'border-[#2563EB] bg-[#2563EB]/[0.03]'
                  : 'border-slate-300 bg-[#F8FAFC] hover:border-slate-400'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-3">
                <p className="text-xs text-[#475569] font-medium">
                  將題目卷檔案拖曳至此，或點擊下方按鈕選取
                </p>
                <label className="cursor-pointer px-5 py-2.5 bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E5E7EB] rounded-xl text-xs font-semibold premium-card-transition edtech-shadow-sm">
                  選擇題目檔案
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {fileData && (
                <div className="mt-4 inline-flex items-center gap-2 bg-[#0EA5A4]/10 border border-[#0EA5A4]/30 px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#0EA5A4]">
                  <span>已成功載入：{fileData.name}</span>
                  <button
                    onClick={() => setFileData(null)}
                    className="ml-2 text-rose-600 font-bold hover:text-rose-800"
                  >
                    移除
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. 題目描述 */}
          <div className="space-y-2.5">
            <label htmlFor="topic-input" className="font-heading font-semibold text-xs text-[#0F172A] uppercase tracking-wider block">
              2. 題目引導與說明
            </label>
            <textarea
              id="topic-input"
              rows={mainMode === 'guidance' ? 3 : 2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                fileData
                  ? '已上傳檔案，系統將自動閱讀試卷內容；可在此補充細節...'
                  : GUIDANCE_CONFIG[guidanceType].placeholder
              }
              className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563EB] text-xs leading-relaxed resize-none premium-card-transition"
            />
          </div>

          {/* 3. 學生內文 */}
          {mainMode === 'correction' && (
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label htmlFor="essay-input" className="font-heading font-semibold text-xs text-[#0F172A] uppercase tracking-wider">
                  3. 學生英文作文內文 (Student Essay)
                </label>
                <span className="font-heading text-[11px] text-[#475569] font-medium">{userEssay.length} 字</span>
              </div>
              <textarea
                id="essay-input"
                rows={10}
                value={userEssay}
                onChange={(e) => setUserEssay(e.target.value)}
                placeholder="請貼上學生英文作文全文..."
                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563EB] text-xs leading-relaxed font-mono resize-none premium-card-transition"
              />
            </div>
          )}

          {/* CTA 按鈕 */}
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className="w-full py-4 bg-[#2563EB] hover:bg-[#1D4ED8] font-heading font-semibold rounded-2xl text-white text-xs tracking-wider transition-all duration-200 edtech-shadow-sm hover:edtech-shadow-hover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {loading ? '系統評量中，請稍候...' : mainMode === 'correction' ? '執行學測作文評量' : '開始寫作引導'}
          </button>
        </div>

        {/* 評量結果：發想模式 */}
        {guidanceResult && !loading && (
          <div className="space-y-5 animate-premium-fade">
            {guidanceResult.theme && (
              <div className="p-8 bg-white border border-[#E5E7EB] rounded-3xl space-y-3 edtech-shadow-sm">
                <div className="font-heading font-semibold text-xs text-[#2563EB] border-b border-slate-100 pb-2.5">
                  審題要旨與寫作方向
                </div>
                <div className="text-xs leading-relaxed text-[#0F172A]" dangerouslySetInnerHTML={{ __html: guidanceResult.theme }} />
              </div>
            )}

            {guidanceResult.outline && (
              <div className="p-8 bg-white border border-[#E5E7EB] rounded-3xl space-y-3 edtech-shadow-sm">
                <div className="font-heading font-semibold text-xs text-[#2563EB] border-b border-slate-100 pb-2.5">
                  段落結構與發展建議
                </div>
                <div className="text-xs leading-relaxed text-[#0F172A]" dangerouslySetInnerHTML={{ __html: guidanceResult.outline }} />
              </div>
            )}

            {guidanceResult.vocab && (
              <div className="p-8 bg-[#F8FAFC] border border-[#E5E7EB] rounded-3xl space-y-3 edtech-shadow-sm">
                <div className="font-heading font-semibold text-xs text-[#0EA5A4] border-b border-slate-200 pb-2.5">
                  高級詞彙與道地片語推薦
                </div>
                <div className="text-xs leading-relaxed text-[#0F172A]" dangerouslySetInnerHTML={{ __html: guidanceResult.vocab }} />
              </div>
            )}
          </div>
        )}

        {/* 評量結果：作文診斷報告 (使用淡藍 #F8FAFC 背景卡片區隔) */}
        {correctionResult && !loading && (
          <div className="space-y-5 animate-premium-fade">
            
            <div className="p-8 md:p-10 bg-white border border-[#E5E7EB] rounded-3xl space-y-4 edtech-shadow-sm">
              <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                <div>
                  <span className="font-heading font-semibold text-[11px] text-[#475569] uppercase tracking-wider block">
                    CEEC 標準模擬預估得分
                  </span>
                  <span className="font-heading text-4xl font-bold text-[#2563EB] mt-1 block">
                    {correctionResult.score}
                  </span>
                </div>
                <span className="font-heading text-xs font-medium text-[#475569]">滿分：20.0</span>
              </div>

              <div className="text-xs leading-relaxed text-[#0F172A]" dangerouslySetInnerHTML={{ __html: correctionResult.summary }} />
            </div>

            {correctionResult.errors && (
              <div className="p-8 bg-white border border-[#E5E7EB] rounded-3xl space-y-3 edtech-shadow-sm">
                <div className="font-heading font-semibold text-xs text-rose-600 border-b border-slate-100 pb-2.5">
                  逐句語法診斷與修訂對照
                </div>
                <div className="text-xs leading-relaxed text-[#0F172A]" dangerouslySetInnerHTML={{ __html: correctionResult.errors }} />
              </div>
            )}

            {correctionResult.modelEssay && (
              <div className="p-8 bg-[#F8FAFC] border border-[#E5E7EB] rounded-3xl space-y-3 edtech-shadow-sm">
                <div className="font-heading font-semibold text-xs text-[#2563EB] border-b border-slate-200 pb-2.5">
                  學測高分標竿範文與解析 (16–18 分級別)
                </div>
                <div className="text-xs leading-relaxed text-[#0F172A]" dangerouslySetInnerHTML={{ __html: correctionResult.modelEssay }} />
              </div>
            )}

          </div>
        )}

        {/* 📚 CEEC 評分維度 */}
        <section id="rubric" className="bg-white p-8 md:p-10 rounded-3xl border border-[#E5E7EB] edtech-shadow-sm space-y-5">
          <h3 className="font-heading font-semibold text-sm text-[#0F172A] border-b border-slate-100 pb-3">
            CEEC 大考中心英文作文評分維度規範
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#475569]">
            <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB]">
              <span className="font-heading font-semibold text-[#0F172A] block mb-1">1. 內容 (Content) — 5 分</span>
              切題度、細節發展完整性、論據邏輯與是否完整回應題目要求。
            </div>
            <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB]">
              <span className="font-heading font-semibold text-[#0F172A] block mb-1">2. 組織 (Organization) — 5 分</span>
              全文結構連貫度、引言與結尾呼應、段落轉折語詞運用的自然度。
            </div>
            <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB]">
              <span className="font-heading font-semibold text-[#0F172A] block mb-1">3. 文法句構 (Grammar & Structures) — 5 分</span>
              句型多樣性（複合句、分詞構句等）、時態一致性與語法精準度。
            </div>
            <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB]">
              <span className="font-heading font-semibold text-[#0F172A] block mb-1">4. 字彙拼字 (Vocabulary & Spelling) — 5 分</span>
              用字精準度與 CEFR B1-B2 詞彙廣度、拼字與大小寫標點之正確性。
            </div>
          </div>
        </section>

        {/* 📊 常見失誤 */}
        <section id="analysis" className="bg-white p-8 md:p-10 rounded-3xl border border-[#E5E7EB] edtech-shadow-sm space-y-4">
          <h3 className="font-heading font-semibold text-sm text-[#0F172A] border-b border-slate-100 pb-3">
            歷年學測英文作文常見失誤提醒
          </h3>
          <ul className="list-disc pl-5 text-xs text-[#475569] space-y-2.5 leading-relaxed">
            <li><b>審題不完整</b>：看圖寫作遺漏圖片轉折關鍵細節，或主題論述未回應題目核心提問。</li>
            <li><b>段落缺乏銜接</b>：句子間缺乏轉折詞（如 However, Consequently, In contrast），全文邏輯較為碎片化。</li>
            <li><b>時態混用</b>：故事敘述未統一採用過去時態，或與現在事實說明混合使用造成混淆。</li>
            <li><b>直譯式搭配詞</b>：過度使用中式英文思考（Chinglish），忽略道地英文動詞與介系詞搭配。</li>
          </ul>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-10 text-center text-xs text-[#475569] mt-16">
        <div className="max-w-6xl mx-auto px-6 space-y-2">
          <p className="font-heading font-semibold text-[#0F172A]">CEEC Essay Assessment · Premium EdTech Standard</p>
          <p className="text-[11px] text-slate-500">本平台評量標準參照財團法人大學入學考試中心基金會（CEEC）公布之非選擇題閱卷規準。</p>
        </div>
      </footer>

    </div>
  );
}