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
  { id: 'under10', label: '10 分以下', desc: '短句正確、兩段完成與基礎詞彙' },
  { id: '11to15', label: '11 – 15 分', desc: '理由舉例、段落銜接與 B1–B2 搭配詞' },
  { id: '16to20', label: '16 – 20 分', desc: '細節推論、自然變化句構與精準用字' },
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
    wordCount: number;
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
    } catch {
      alert('暫時無法完成，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled =
    loading ||
    (!topic.trim() && !fileData) ||
    (mainMode === 'correction' && !userEssay.trim());

  return (
    <div className="app-shell min-h-screen text-[#37352F] selection:bg-[#D9EFE5] selection:text-[#214438]">
      
      {/* 🏛️ 置中主容器 (Strict Max-Width 960px) */}
      <div className="max-w-[1040px] mx-auto px-5 py-10 sm:px-6 md:py-20">

        {/* 頂部 Notion Style Pill */}
        <div className="flex justify-center mb-9">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/80 border border-white rounded-full text-[11px] font-semibold tracking-wide text-[#547067] shadow-sm backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-[#3F8A70] shadow-[0_0_0_4px_rgba(63,138,112,0.12)]"></span>
            <span>英文作文練習</span>
          </div>
        </div>

        {/* 🚀 Hero 區塊：Notion 標題風格 */}
        <section className="text-center mb-12 space-y-5">
          <h1 className="font-heading font-bold text-4xl sm:text-5xl md:text-[58px] text-[#26332f] leading-[1.12] tracking-[-0.045em]">
            把英文作文，慢慢寫好。
          </h1>
          <p className="text-[#68736f] text-base md:text-lg font-normal leading-relaxed max-w-[620px] mx-auto">
            貼上題目和作文，看看哪裡可以寫得更清楚、更自然。
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 pt-2 text-xs text-[#5b6d66]">
            <span className="rounded-full border border-[#d8e6df] bg-white/65 px-3 py-1.5">四向度評分</span>
            <span className="rounded-full border border-[#d8e6df] bg-white/65 px-3 py-1.5">逐句修訂</span>
            <span className="rounded-full border border-[#d8e6df] bg-white/65 px-3 py-1.5">高分範文</span>
          </div>
        </section>

        {/* 💻 中央表單系統 */}
        <main className="space-y-12">

          {/* 模式選擇 (Notion Segment Switch) */}
          <div className="bg-white/60 p-1.5 rounded-2xl border border-white grid grid-cols-2 gap-1.5 shadow-[0_8px_24px_rgba(60,72,66,0.05)] backdrop-blur-sm">
            <button
              onClick={() => {
                setMainMode('correction');
                setGuidanceResult(null);
                setCorrectionResult(null);
              }}
              className={`h-[44px] rounded-lg text-xs font-semibold transition-all duration-150 ${
                mainMode === 'correction'
                  ? 'bg-white text-[#37352F] shadow-2xs'
                  : 'text-[#787774] hover:text-[#37352F]'
              }`}
            >
              幫我改作文
            </button>
            <button
              onClick={() => {
                setMainMode('guidance');
                setGuidanceResult(null);
                setCorrectionResult(null);
              }}
              className={`h-[44px] rounded-lg text-xs font-semibold transition-all duration-150 ${
                mainMode === 'guidance'
                  ? 'bg-white text-[#37352F] shadow-2xs'
                  : 'text-[#787774] hover:text-[#37352F]'
              }`}
            >
              一起想題目
            </button>
          </div>

          {/* 主要卡片容器 */}
          <div className="notion-card p-8 md:p-10 rounded-[20px] space-y-8">

            {/* 寫作發想子類型選擇 */}
            {mainMode === 'guidance' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#787774] uppercase tracking-wider block text-left">
                  選擇題目類型
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {(Object.keys(GUIDANCE_CONFIG) as GuidanceType[]).map((key) => {
                    const isActive = guidanceType === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setGuidanceType(key);
                          setTopic('');
                        }}
                        className={`h-[48px] rounded-xl text-xs font-medium transition-all border ${
                          isActive
                            ? 'bg-[#37352F] text-white border-[#37352F]'
                            : 'bg-white text-[#37352F] border-[#E9E8E4] hover:bg-[#F7F6F3]'
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
                <label className="text-xs font-semibold text-[#787774] uppercase tracking-wider block text-left">
                  設定目標級分
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SCORE_OPTIONS.map((opt) => {
                    const isSelected = targetScore === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setTargetScore(opt.id)}
                        className={`p-4 rounded-xl text-left transition-all border ${
                          isSelected
                            ? 'bg-[#E8F0FE] border-[#2383E2] text-[#1E40AF]'
                            : 'bg-white border-[#E9E8E4] text-[#37352F] hover:bg-[#F7F6F3]'
                        }`}
                      >
                        <div className="font-semibold text-xs">{opt.label}</div>
                        <div className="text-[11px] opacity-80 mt-1">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 1. 上傳檔案 */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-[#787774] uppercase tracking-wider block text-left">
                1. 題目卷檔案 (PDF / JPG / PNG)
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-8 rounded-2xl border border-dashed text-center transition-all ${
                  isDragging
                    ? 'border-[#2383E2] bg-[#E8F0FE]/30'
                    : 'border-[#E9E8E4] bg-[#FBFBFA]'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <span className="text-xs text-[#787774]">
                    拖曳檔案至此區域，或點擊選擇檔案
                  </span>
                  <label className="cursor-pointer h-[44px] px-5 bg-white hover:bg-[#F7F6F3] text-[#37352F] border border-[#E9E8E4] rounded-lg text-xs font-medium inline-flex items-center justify-center transition-all shadow-2xs">
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
                  <div className="mt-4 inline-flex items-center gap-2 notion-bg-gray px-3.5 py-1.5 rounded-md text-xs font-medium">
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
              <label htmlFor="topic-input" className="text-xs font-semibold text-[#787774] uppercase tracking-wider block text-left">
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
                className="w-full notion-input rounded-xl p-4 text-xs leading-relaxed resize-none transition-all"
              />
            </div>

            {/* 3. 學生內文 */}
            {mainMode === 'correction' && (
              <div className="space-y-3 pt-4 border-t border-[#E9E8E4]">
                <div className="flex justify-between items-center">
                  <label htmlFor="essay-input" className="text-xs font-semibold text-[#787774] uppercase tracking-wider text-left">
                    3. 學生英文作文全文
                  </label>
                  <span className="text-[11px] text-[#787774]">{userEssay.length} 字</span>
                </div>
                <textarea
                  id="essay-input"
                  rows={9}
                  value={userEssay}
                  onChange={(e) => setUserEssay(e.target.value)}
                  placeholder="請貼上學生英文作文內容..."
                  className="w-full notion-input rounded-xl p-4 text-xs leading-relaxed font-mono resize-none transition-all"
                />
              </div>
            )}

            {/* CTA 按鈕 */}
            <button
              onClick={handleGenerate}
              disabled={isButtonDisabled}
              className="w-full h-[48px] bg-[#2383E2] hover:bg-[#1D6FCD] text-white font-medium rounded-xl text-xs tracking-wider transition-all disabled:bg-[#E9E8E4] disabled:text-[#A8A7A1] disabled:cursor-not-allowed"
            >
              {loading ? '整理中...' : mainMode === 'correction' ? '看看怎麼修改' : '給我寫作方向'}
            </button>
          </div>

          {/* 📊 評量結果：發想模式 (Notion Callout Cards) */}
          {guidanceResult && !loading && (
            <div className="space-y-4">
              {guidanceResult.theme && (
                <div className="p-6 bg-white border border-[#E9E8E4] rounded-[16px] space-y-2.5">
                  <div className="inline-block px-2.5 py-0.5 notion-bg-blue rounded-md text-[11px] font-semibold">
                    審題要旨與寫作方向
                  </div>
                  <div className="result-content text-xs leading-relaxed text-[#37352F] text-left pt-1" dangerouslySetInnerHTML={{ __html: guidanceResult.theme }} />
                </div>
              )}

              {guidanceResult.outline && (
                <div className="p-6 bg-white border border-[#E9E8E4] rounded-[16px] space-y-2.5">
                  <div className="inline-block px-2.5 py-0.5 notion-bg-yellow rounded-md text-[11px] font-semibold">
                    段落結構發展建議
                  </div>
                  <div className="result-content text-xs leading-relaxed text-[#37352F] text-left pt-1" dangerouslySetInnerHTML={{ __html: guidanceResult.outline }} />
                </div>
              )}

              {guidanceResult.vocab && (
                <div className="p-6 bg-white border border-[#E9E8E4] rounded-[16px] space-y-2.5">
                  <div className="inline-block px-2.5 py-0.5 notion-bg-green rounded-md text-[11px] font-semibold">
                    進階詞彙與道地句型
                  </div>
                  <div className="result-content text-xs leading-relaxed text-[#37352F] text-left pt-1" dangerouslySetInnerHTML={{ __html: guidanceResult.vocab }} />
                </div>
              )}
            </div>
          )}

          {/* 📊 評量結果：診斷模式 */}
          {correctionResult && !loading && (
            <div className="space-y-4">
              <div className="p-8 bg-white border border-[#E9E8E4] rounded-[20px] space-y-4">
                <div className="flex justify-between items-end border-b border-[#E9E8E4] pb-4">
                  <div className="text-left">
                    <span className="text-[11px] font-semibold text-[#787774] uppercase tracking-wider block">
                      作文分數參考
                    </span>
                    <span className="font-heading text-4xl font-bold text-[#2383E2] mt-1 block">
                      {correctionResult.score}
                    </span>
                  </div>
                  <div className="text-right text-xs text-[#787774] space-y-1">
                    <span className="block">英文單字 {correctionResult.wordCount} 個</span>
                    <span className="block">滿分 20.0</span>
                  </div>
                </div>
                <div className="result-content text-xs leading-relaxed text-[#37352F] text-left" dangerouslySetInnerHTML={{ __html: correctionResult.summary }} />
              </div>

              {correctionResult.errors && (
                <div className="p-6 bg-white border border-[#E9E8E4] rounded-[16px] space-y-2.5">
                  <div className="inline-block px-2.5 py-0.5 notion-bg-red rounded-md text-[11px] font-semibold">
                    逐句語法診斷與修正對照
                  </div>
                  <div className="result-content text-xs leading-relaxed text-[#37352F] text-left pt-1" dangerouslySetInnerHTML={{ __html: correctionResult.errors }} />
                </div>
              )}

              {correctionResult.modelEssay && (
                <div className="p-6 bg-white border border-[#E9E8E4] rounded-[16px] space-y-2.5">
                  <div className="inline-block px-2.5 py-0.5 notion-bg-green rounded-md text-[11px] font-semibold">
                    高分標竿範文 (16–18 分級別)
                  </div>
                  <div className="result-content text-xs leading-relaxed text-[#37352F] text-left pt-1" dangerouslySetInnerHTML={{ __html: correctionResult.modelEssay }} />
                </div>
              )}
            </div>
          )}

          {/* 📚 評分維度說明 */}
          <section className="bg-white p-8 rounded-[20px] border border-[#E9E8E4] space-y-5">
            <h2 className="text-sm font-semibold text-[#37352F] border-b border-[#E9E8E4] pb-3 text-left">
              評分時會看這四件事
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#787774] text-left">
              <div className="p-4 notion-bg-gray rounded-xl">
                <span className="font-semibold text-[#37352F] block mb-1">1. 內容 (Content) — 5 分</span>
                切題度、細節發展完整性與論據邏輯。
              </div>
              <div className="p-4 notion-bg-gray rounded-xl">
                <span className="font-semibold text-[#37352F] block mb-1">2. 組織 (Organization) — 5 分</span>
                結構連貫性、段落銜接與轉折詞運用。
              </div>
              <div className="p-4 notion-bg-gray rounded-xl">
                <span className="font-semibold text-[#37352F] block mb-1">3. 文法句構 (Grammar & Structures) — 5 分</span>
                句型多樣性、時態一致性與語法精準度。
              </div>
              <div className="p-4 notion-bg-gray rounded-xl">
                <span className="font-semibold text-[#37352F] block mb-1">4. 字彙拼字 (Vocabulary & Spelling) — 5 分</span>
                CEFR B1-B2 詞彙廣度、搭配詞與拼字正確性。
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="mt-20 text-center text-xs text-[#787774]">
          <p className="font-medium text-[#37352F]">英文作文練習</p>
          <p className="text-[11px] mt-1 opacity-70">評分項目參考大考中心英文作文閱卷規準。</p>
        </footer>

      </div>
    </div>
  );
}
