'use client';

import { useState } from 'react';
import { generateEssayHelp } from './actions';

type MainMode = 'correction' | 'guidance';
type GuidanceType = 'picture' | 'chart' | 'essay' | 'vocab';
type TargetScore = 'under10' | '11to15' | '16to20';

const GUIDANCE_CONFIG: Record<GuidanceType, { label: string; placeholder: string }> = {
  picture: {
    label: '看圖寫作',
    placeholder: '輸入四格漫畫故事轉折或上傳試卷檔案...',
  },
  chart: {
    label: '圖表說明',
    placeholder: '輸入統計圖表數據趨勢與比較核心...',
  },
  essay: {
    label: '主題論述',
    placeholder: '輸入學測作文題目、引導文字與論述主張...',
  },
  vocab: {
    label: '進階詞彙',
    placeholder: '輸入寫作主題關鍵字（例如：環境永續、AI 科技）...',
  },
};

const SCORE_OPTIONS: { id: TargetScore; label: string; desc: string }[] = [
  { id: 'under10', label: '10 分以下', desc: '著重句型完整度與基礎詞彙' },
  { id: '11to15', label: '11 – 15 分', desc: '強化段落銜接與道地詞彙' },
  { id: '16to20', label: '16 – 20 分', desc: '精準破題與深度立意發展' },
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
    <div className="min-h-screen bg-[#FBFBFA] text-[#0F172A] selection:bg-slate-200">
      
      {/* 🏛️ 置中主容器 (Strict Max-Width 960px) */}
      <div className="max-w-[960px] mx-auto px-6 py-16 md:py-24">

        {/* 頂部 Minimal Brand Key */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white rounded-full minimal-shadow text-xs font-semibold text-[#0F172A]">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
            <span>CEEC Essay Assessment Standard</span>
          </div>
        </div>

        {/* 🚀 Hero 區塊：中央對齊、標題 64px 700、副標 20px 400、間距 16px、下留白 64px */}
        <section className="text-center mb-16">
          <h1 className="font-heading font-bold text-4xl sm:text-5xl md:text-[64px] text-[#0F172A] leading-[1.08] tracking-tight mb-4">
            學測英文作文，不只批改，更教你怎麼拿高分。
          </h1>
          <p className="text-[#475569] text-lg md:text-[20px] font-normal leading-relaxed max-w-[680px] mx-auto">
            專為高中生與教練打造的極簡評量系統，精準診斷語法失誤並提供標竿範文。
          </p>
        </section>

        {/* 💻 中央表單系統（同一垂直軸、單一卡片容器、圓角 20px） */}
        <main className="space-y-14">

          {/* 模式選擇 (Select / Segment) */}
          <div className="bg-white p-2 rounded-[20px] minimal-shadow grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setMainMode('correction');
                setGuidanceResult(null);
                setCorrectionResult(null);
              }}
              className={`h-[48px] rounded-[14px] text-sm font-semibold ui-transition ${
                mainMode === 'correction'
                  ? 'bg-[#0F172A] text-white'
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
              className={`h-[48px] rounded-[14px] text-sm font-semibold ui-transition ${
                mainMode === 'guidance'
                  ? 'bg-[#0F172A] text-white'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              寫作發想 (Guidance)
            </button>
          </div>

          {/* 主要表單區塊 */}
          <div className="bg-white p-8 md:p-10 rounded-[20px] minimal-shadow space-y-8">

            {/* 寫作發想子類型選擇 */}
            {mainMode === 'guidance' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider block text-left">
                  選擇題目類型
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.keys(GUIDANCE_CONFIG) as GuidanceType[]).map((key) => {
                    const isActive = guidanceType === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setGuidanceType(key);
                          setTopic('');
                        }}
                        className={`h-[52px] rounded-[16px] text-xs font-semibold ui-transition border ${
                          isActive
                            ? 'bg-[#0F172A] text-white border-[#0F172A]'
                            : 'bg-white text-[#475569] border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {GUIDANCE_CONFIG[key].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 目標級分設定 */}
            {mainMode === 'guidance' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider block text-left">
                  設定目標級分
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SCORE_OPTIONS.map((opt) => {
                    const isSelected = targetScore === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setTargetScore(opt.id)}
                        className={`p-4 rounded-[16px] text-left ui-transition border ${
                          isSelected
                            ? 'bg-slate-50 border-[#0F172A] text-[#0F172A]'
                            : 'bg-white border-slate-200 text-[#475569]'
                        }`}
                      >
                        <div className="font-semibold text-xs text-[#0F172A]">{opt.label}</div>
                        <div className="text-[11px] text-[#475569] mt-1">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 1. 上傳檔案 (52px 統一按鈕與佈局) */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider block text-left">
                1. 題目卷檔案 (PDF / JPG / PNG)
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-8 rounded-[16px] border border-dashed text-center ui-transition ${
                  isDragging
                    ? 'border-[#0F172A] bg-slate-50'
                    : 'border-slate-200 bg-[#FBFBFA]'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <span className="text-xs text-[#475569]">
                    拖曳檔案至此區域，或點擊選擇檔案
                  </span>
                  <label className="cursor-pointer h-[48px] px-6 bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-200 rounded-[14px] text-xs font-semibold inline-flex items-center justify-center minimal-shadow ui-transition">
                    上傳題目檔案
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {fileData && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-[12px] text-xs font-medium text-[#0F172A]">
                    <span>{fileData.name}</span>
                    <button
                      onClick={() => setFileData(null)}
                      className="ml-2 text-rose-600 hover:text-rose-800 font-bold"
                    >
                      移除
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. 題目引導與說明 */}
            <div className="space-y-3">
              <label htmlFor="topic-input" className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider block text-left">
                2. 題目文字說明
              </label>
              <textarea
                id="topic-input"
                rows={mainMode === 'guidance' ? 3 : 2}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={
                  fileData
                    ? '已成功讀取試卷檔案，可在此補充額外細節需求...'
                    : GUIDANCE_CONFIG[guidanceType].placeholder
                }
                className="w-full bg-[#FBFBFA] border border-slate-200 rounded-[16px] p-4 text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0F172A] text-xs leading-relaxed resize-none ui-transition"
              />
            </div>

            {/* 3. 學生內文 (僅在評量模式顯示) */}
            {mainMode === 'correction' && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label htmlFor="essay-input" className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider text-left">
                    3. 學生英文作文全文
                  </label>
                  <span className="text-[11px] text-[#475569]">{userEssay.length} 字</span>
                </div>
                <textarea
                  id="essay-input"
                  rows={9}
                  value={userEssay}
                  onChange={(e) => setUserEssay(e.target.value)}
                  placeholder="請貼上學生英文作文內容..."
                  className="w-full bg-[#FBFBFA] border border-slate-200 rounded-[16px] p-4 text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0F172A] text-xs leading-relaxed font-mono resize-none ui-transition"
                />
              </div>
            )}

            {/* CTA 按鈕：高度統一 52px、圓角 14px */}
            <button
              onClick={handleGenerate}
              disabled={isButtonDisabled}
              className="w-full h-[52px] bg-[#0F172A] hover:bg-black text-white font-semibold rounded-[14px] text-xs tracking-wider ui-transition minimal-shadow disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {loading ? '系統分析中...' : mainMode === 'correction' ? '開始 CEEC 評量' : '開始寫作發想'}
            </button>
          </div>

          {/* 📊 評量結果：發想模式 */}
          {guidanceResult && !loading && (
            <div className="space-y-6">
              {guidanceResult.theme && (
                <div className="p-8 bg-white rounded-[20px] minimal-shadow space-y-3">
                  <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider border-b border-slate-100 pb-3 text-left">
                    審題要旨與寫作方向
                  </h3>
                  <div className="text-xs leading-relaxed text-[#0F172A] text-left" dangerouslySetInnerHTML={{ __html: guidanceResult.theme }} />
                </div>
              )}

              {guidanceResult.outline && (
                <div className="p-8 bg-white rounded-[20px] minimal-shadow space-y-3">
                  <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider border-b border-slate-100 pb-3 text-left">
                    段落結構發展建議
                  </h3>
                  <div className="text-xs leading-relaxed text-[#0F172A] text-left" dangerouslySetInnerHTML={{ __html: guidanceResult.outline }} />
                </div>
              )}

              {guidanceResult.vocab && (
                <div className="p-8 bg-white rounded-[20px] minimal-shadow space-y-3">
                  <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider border-b border-slate-100 pb-3 text-left">
                    進階詞彙與道地句型
                  </h3>
                  <div className="text-xs leading-relaxed text-[#0F172A] text-left" dangerouslySetInnerHTML={{ __html: guidanceResult.vocab }} />
                </div>
              )}
            </div>
          )}

          {/* 📊 評量結果：診斷模式 */}
          {correctionResult && !loading && (
            <div className="space-y-6">
              <div className="p-8 md:p-10 bg-white rounded-[20px] minimal-shadow space-y-4">
                <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                  <div className="text-left">
                    <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider block">
                      CEEC 模擬預估得分
                    </span>
                    <span className="font-heading text-4xl font-bold text-[#0F172A] mt-1 block">
                      {correctionResult.score}
                    </span>
                  </div>
                  <span className="text-xs text-[#475569]">滿分 20.0</span>
                </div>
                <div className="text-xs leading-relaxed text-[#0F172A] text-left" dangerouslySetInnerHTML={{ __html: correctionResult.summary }} />
              </div>

              {correctionResult.errors && (
                <div className="p-8 bg-white rounded-[20px] minimal-shadow space-y-3">
                  <h3 className="text-xs font-semibold text-rose-600 uppercase tracking-wider border-b border-slate-100 pb-3 text-left">
                    逐句語法診斷與修正建議
                  </h3>
                  <div className="text-xs leading-relaxed text-[#0F172A] text-left" dangerouslySetInnerHTML={{ __html: correctionResult.errors }} />
                </div>
              )}

              {correctionResult.modelEssay && (
                <div className="p-8 bg-white rounded-[20px] minimal-shadow space-y-3">
                  <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider border-b border-slate-100 pb-3 text-left">
                    高分標竿範文 (16–18 分級別)
                  </h3>
                  <div className="text-xs leading-relaxed text-[#0F172A] text-left" dangerouslySetInnerHTML={{ __html: correctionResult.modelEssay }} />
                </div>
              )}
            </div>
          )}

          {/* 📚 CEEC 評分維度說明（單一對齊軸卡片） */}
          <section className="bg-white p-8 md:p-10 rounded-[20px] minimal-shadow space-y-6">
            <h2 className="text-sm font-semibold text-[#0F172A] border-b border-slate-100 pb-4 text-left">
              CEEC 大考中心英文作文評分規準
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#475569] text-left">
              <div className="p-5 bg-[#FBFBFA] rounded-[16px]">
                <span className="font-semibold text-[#0F172A] block mb-1">1. 內容 (Content) — 5 分</span>
                切題度、細節發展完整性與論據邏輯。
              </div>
              <div className="p-5 bg-[#FBFBFA] rounded-[16px]">
                <span className="font-semibold text-[#0F172A] block mb-1">2. 組織 (Organization) — 5 分</span>
                結構連貫性、段落銜接與轉折詞運用。
              </div>
              <div className="p-5 bg-[#FBFBFA] rounded-[16px]">
                <span className="font-semibold text-[#0F172A] block mb-1">3. 文法句構 (Grammar & Structures) — 5 分</span>
                句型多樣性、時態一致性與語法精準度。
              </div>
              <div className="p-5 bg-[#FBFBFA] rounded-[16px]">
                <span className="font-semibold text-[#0F172A] block mb-1">4. 字彙拼字 (Vocabulary & Spelling) — 5 分</span>
                CEFR B1-B2 詞彙廣度、搭配詞與拼字正確性。
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="mt-20 text-center text-xs text-[#475569]">
          <p className="font-semibold text-[#0F172A]">CEEC Essay Assessment Standard</p>
          <p className="text-[11px] mt-1 text-slate-400">本系統參照大學入學考試中心基金會非選擇題閱卷規準設計。</p>
        </footer>

      </div>
    </div>
  );
}