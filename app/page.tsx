'use client';

import { useState } from 'react';
import { generateEssayHelp } from './actions';

type MainMode = 'correction' | 'guidance';
type GuidanceType = 'picture' | 'chart' | 'essay' | 'vocab';
type TargetScore = 'under10' | '11to15' | '16to20';

const GUIDANCE_CONFIG: Record<GuidanceType, { label: string; placeholder: string }> = {
  picture: {
    label: '看圖寫作',
    placeholder: '上傳學測四格漫畫試卷（PDF / JPG），或輸入故事圖片情境描述...',
  },
  chart: {
    label: '圖表說明',
    placeholder: '上傳統計圖表試卷，或輸入圖表數據趨勢與項目對比...',
  },
  essay: {
    label: '主題論述',
    placeholder: '輸入學測寫作題目、引導文字，或描述個人論述觀點...',
  },
  vocab: {
    label: '單字與片語建議',
    placeholder: '輸入寫作主題關鍵字（例如：氣候變遷、青少年壓力、AI 發展應用）...',
  },
};

const SCORE_OPTIONS: { id: TargetScore; label: string; desc: string }[] = [
  { id: 'under10', label: '10 分以下 · 基礎打底', desc: '鞏固句型完整度與核心詞彙，降低語法錯誤率' },
  { id: '11to15', label: '11 – 15 分 · 進階提升', desc: '強化段落銜接、複合句型與道地詞彙搭配' },
  { id: '16to20', label: '16 – 20 分 · 高分標竿', desc: '精準破題、進階修辭手法與深度立意發展' },
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
      alert('系統處理異常，請重試。');
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled =
    loading ||
    (!topic.trim() && !fileData) ||
    (mainMode === 'correction' && !userEssay.trim());

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0F172A] flex flex-col justify-between">
      
      {/* 頂部導覽 */}
      <header className="sticky top-0 z-50 bg-[#FAFAF8]/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center font-heading font-bold text-white text-xs shadow-xs">
              E
            </div>
            <span className="font-heading font-bold text-base tracking-tight text-[#0F172A]">
              CEEC Writing Assessment
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              EdTech Standard
            </span>
          </div>

          <nav className="flex items-center gap-6 text-xs font-medium text-[#475569]">
            <a href="#workflow" className="hover:text-[#2563EB] edtech-card-transition">閱卷流程</a>
            <a href="#rubric" className="hover:text-[#2563EB] edtech-card-transition">評分規準</a>
            <a href="#analysis" className="hover:text-[#2563EB] edtech-card-transition">常規分析</a>
          </nav>
        </div>
      </header>

      {/* Hero 區塊 */}
      <section className="hero-gradient border-b border-slate-200/60 py-16 px-6 animate-fade-in">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-2xs text-xs font-medium text-[#2563EB]">
            <span>CEEC 大考中心學測英文科評量邏輯</span>
          </div>
          
          <h1 className="font-heading font-bold text-3xl md:text-5xl text-[#0F172A] tracking-tight leading-[1.15]">
            學測英文作文，不只批改，<br />更教你怎麼拿高分。
          </h1>
          
          <p className="text-[#475569] text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            上傳題目、輸入作文，立即獲得符合 CEEC 評分邏輯的分項評分、修改建議與高分範文。
          </p>
        </div>
      </section>

      {/* 閱卷流程 (Sequential Step Reveal) */}
      <section id="workflow" className="max-w-5xl mx-auto px-6 -mt-6 z-10 w-full animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            
            <div className="step-item-1 p-3.5 rounded-lg border border-slate-200 bg-white edtech-card-transition">
              <span className="font-heading font-semibold text-[11px] text-[#2563EB] uppercase tracking-wider block">01 / Step</span>
              <span className="font-heading font-semibold text-sm text-[#0F172A] block mt-0.5">選擇題型</span>
              <span className="text-xs text-[#475569] block mt-0.5">看圖 / 圖表 / 主題論述</span>
            </div>

            <div className="step-item-2 p-3.5 rounded-lg border border-slate-200 bg-white edtech-card-transition">
              <span className="font-heading font-semibold text-[11px] text-[#2563EB] uppercase tracking-wider block">02 / Step</span>
              <span className="font-heading font-semibold text-sm text-[#0F172A] block mt-0.5">上傳題目</span>
              <span className="text-xs text-[#475569] block mt-0.5">PDF、圖片或試卷描述</span>
            </div>

            <div className="step-item-3 p-3.5 rounded-lg border border-slate-200 bg-white edtech-card-transition">
              <span className="font-heading font-semibold text-[11px] text-[#2563EB] uppercase tracking-wider block">03 / Step</span>
              <span className="font-heading font-semibold text-sm text-[#0F172A] block mt-0.5">輸入作文</span>
              <span className="text-xs text-[#475569] block mt-0.5">貼上學生英文寫作內容</span>
            </div>

            <div className="step-item-4 p-3.5 rounded-lg border border-slate-200 bg-white edtech-card-transition">
              <span className="font-heading font-semibold text-[11px] text-[#0EA5A4] uppercase tracking-wider block">04 / Step</span>
              <span className="font-heading font-semibold text-sm text-[#0F172A] block mt-0.5">取得評分報告</span>
              <span className="text-xs text-[#475569] block mt-0.5">四大維度得分與精準修訂</span>
            </div>

          </div>
        </div>
      </section>

      {/* 主體功能區塊 */}
      <main className="max-w-5xl mx-auto px-6 py-10 w-full space-y-6">

        {/* 模式切換 Segment Control */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl max-w-md mx-auto">
          <button
            onClick={() => {
              setMainMode('correction');
              setGuidanceResult(null);
              setCorrectionResult(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg edtech-card-transition ${
              mainMode === 'correction'
                ? 'bg-white text-[#0F172A] shadow-xs'
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
            className={`flex-1 py-2 text-xs font-semibold rounded-lg edtech-card-transition ${
              mainMode === 'guidance'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            引導發想 (Guidance)
          </button>
        </div>

        {/* 題型按鈕 */}
        {mainMode === 'guidance' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 animate-fade-in">
            {(Object.keys(GUIDANCE_CONFIG) as GuidanceType[]).map((key) => {
              const isActive = guidanceType === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setGuidanceType(key);
                    setTopic('');
                  }}
                  className={`p-3 text-xs font-semibold rounded-xl border text-center edtech-card-transition hover:-translate-y-0.5 ${
                    isActive
                      ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                      : 'bg-white text-[#475569] border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {GUIDANCE_CONFIG[key].label}
                </button>
              );
            })}
          </div>
        )}

        {/* 程度設定卡片 (選取 Scale 1.02, 藍邊框) */}
        {mainMode === 'guidance' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 animate-fade-in">
            <span className="font-heading font-semibold text-xs text-[#0F172A] uppercase tracking-wider block">
              目標級分與設定 (Target Band)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SCORE_OPTIONS.map((opt) => {
                const isSelected = targetScore === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTargetScore(opt.id)}
                    className={`p-4 rounded-xl border text-left edtech-card-transition ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#2563EB]/[0.02] text-[#0F172A] scale-[1.02] shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="font-heading font-semibold text-xs text-[#0F172A]">{opt.label}</div>
                    <div className="text-xs text-[#475569] mt-1 leading-relaxed">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 主要輸入 Form 卡片 */}
        <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
          
          {/* 上傳區塊 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-heading font-semibold text-xs text-[#0F172A] uppercase tracking-wider">
                1. 上傳試卷或題目 (PDF / JPG / PNG)
              </label>
              <span className="text-[11px] text-[#475569]">可直接拖曳檔案</span>
            </div>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-6 border border-dashed rounded-xl text-center edtech-card-transition ${
                isDragging
                  ? 'border-[#2563EB] bg-[#2563EB]/[0.04]'
                  : 'border-slate-300 bg-[#FAFAF8] hover:border-slate-400'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <p className="text-xs text-[#475569] font-medium">
                  將題目檔案拖曳至此，或點擊選擇檔案
                </p>
                <label className="cursor-pointer px-4 py-2 bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 rounded-lg text-xs font-semibold edtech-card-transition shadow-2xs hover:-translate-y-0.5">
                  瀏覽檔案
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {fileData && (
                <div className="mt-4 inline-flex items-center gap-2 bg-[#0EA5A4]/10 border border-[#0EA5A4]/30 px-3 py-1.5 rounded-lg text-xs font-medium text-[#0EA5A4]">
                  <span>已載入檔案：{fileData.name}</span>
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

          {/* 題目描述 */}
          <div className="space-y-2">
            <label htmlFor="topic-input" className="font-heading font-semibold text-xs text-[#0F172A] uppercase tracking-wider block">
              2. 題目引導與描述
            </label>
            <textarea
              id="topic-input"
              rows={mainMode === 'guidance' ? 3 : 2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                fileData
                  ? '已上傳檔案，系統將自動解析題目內容；可在此補充細節說明...'
                  : GUIDANCE_CONFIG[guidanceType].placeholder
              }
              className="w-full bg-[#FAFAF8] border border-slate-200 rounded-lg p-3.5 text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563EB] text-xs leading-relaxed resize-none edtech-card-transition"
            />
          </div>

          {/* 文章輸入 */}
          {mainMode === 'correction' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label htmlFor="essay-input" className="font-heading font-semibold text-xs text-[#0F172A] uppercase tracking-wider">
                  3. 學生內文 (Student Essay)
                </label>
                <span className="font-heading text-[11px] text-[#475569] font-medium">{userEssay.length} 字</span>
              </div>
              <textarea
                id="essay-input"
                rows={9}
                value={userEssay}
                onChange={(e) => setUserEssay(e.target.value)}
                placeholder="貼上學生英文作文全文..."
                className="w-full bg-[#FAFAF8] border border-slate-200 rounded-lg p-3.5 text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563EB] text-xs leading-relaxed font-mono resize-none edtech-card-transition"
              />
            </div>
          )}

          {/* CTA 按鈕 */}
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className="w-full py-3.5 cta-button-gradient font-heading font-semibold rounded-xl text-white text-xs tracking-wider edtech-card-transition hover:shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {loading ? '系統即時分析評量中...' : mainMode === 'correction' ? '執行學測作文評量' : '開始寫作引導'}
          </button>
        </div>

        {/* 評量結果：引導模式 */}
        {guidanceResult && !loading && (
          <div className="space-y-4 animate-fade-in">
            {guidanceResult.theme && (
              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                <div className="font-heading font-semibold text-xs text-[#2563EB] border-b border-slate-100 pb-2">
                  審題要旨與寫作方向
                </div>
                <div className="text-xs leading-relaxed text-[#0F172A]" dangerouslySetInnerHTML={{ __html: guidanceResult.theme }} />
              </div>
            )}

            {guidanceResult.outline && (
              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                <div className="font-heading font-semibold text-xs text-[#2563EB] border-b border-slate-100 pb-2">
                  段落結構與發展建議
                </div>
                <div className="text-xs leading-relaxed text-[#0F172A]" dangerouslySetInnerHTML={{ __html: guidanceResult.outline }} />
              </div>
            )}

            {guidanceResult.vocab && (
              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                <div className="font-heading font-semibold text-xs text-[#0EA5A4] border-b border-slate-100 pb-2">
                  進階字彙與道地片語推薦
                </div>
                <div className="text-xs leading-relaxed text-[#0F172A]" dangerouslySetInnerHTML={{ __html: guidanceResult.vocab }} />
              </div>
            )}
          </div>
        )}

        {/* 評量結果：作文診斷報告 */}
        {correctionResult && !loading && (
          <div className="space-y-4 animate-fade-in">
            
            <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
              <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                <div>
                  <span className="font-heading font-semibold text-[11px] text-[#475569] uppercase tracking-wider block">
                    CEEC 標準模擬預估得分
                  </span>
                  <span className="font-heading text-4xl font-bold text-[#2563EB] mt-1 block">
                    {correctionResult.score}
                  </span>
                </div>
                <span className="font-heading text-xs font-medium text-[#475569]">目標滿分：20.0</span>
              </div>

              <div className="text-xs leading-relaxed text-[#0F172A]" dangerouslySetInnerHTML={{ __html: correctionResult.summary }} />
            </div>

            {correctionResult.errors && (
              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div className="font-heading font-semibold text-xs text-rose-600 border-b border-slate-100 pb-2">
                  逐句診斷與修訂建議
                </div>
                <div className="text-xs leading-relaxed text-[#0F172A]" dangerouslySetInnerHTML={{ __html: correctionResult.errors }} />
              </div>
            )}

            {correctionResult.modelEssay && (
              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div className="font-heading font-semibold text-xs text-[#2563EB] border-b border-slate-100 pb-2">
                  高分標竿範文與解析
                </div>
                <div className="text-xs leading-relaxed text-[#0F172A]" dangerouslySetInnerHTML={{ __html: correctionResult.modelEssay }} />
              </div>
            )}

          </div>
        )}

        {/* 評分維度說明 */}
        <section id="rubric" className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-heading font-semibold text-sm text-[#0F172A] border-b border-slate-100 pb-3">
            CEEC 大考中心英文非選擇題評分標準
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#475569]">
            <div className="p-4 bg-[#FAFAF8] rounded-lg border border-slate-200/80">
              <span className="font-heading font-semibold text-[#0F172A] block mb-1">1. 內容 (Content) — 5 分</span>
              切題度、細節發展完整性、論據邏輯與是否完整回應題目要求。
            </div>
            <div className="p-4 bg-[#FAFAF8] rounded-lg border border-slate-200/80">
              <span className="font-heading font-semibold text-[#0F172A] block mb-1">2. 組織 (Organization) — 5 分</span>
              全文結構連貫度、引言與結尾呼應、段落轉折語詞運用的自然度。
            </div>
            <div className="p-4 bg-[#FAFAF8] rounded-lg border border-slate-200/80">
              <span className="font-heading font-semibold text-[#0F172A] block mb-1">3. 文法句構 (Grammar & Structures) — 5 分</span>
              句型多樣性（複合句、分詞構句等）、時態一致性與語法精準度。
            </div>
            <div className="p-4 bg-[#FAFAF8] rounded-lg border border-slate-200/80">
              <span className="font-heading font-semibold text-[#0F172A] block mb-1">4. 字彙拼字 (Vocabulary & Spelling) — 5 分</span>
              用字精準度與 CEFR B1-B2 詞彙廣度、拼字與大小寫標點之正確性。
            </div>
          </div>
        </section>

        {/* 歷年統計分析 */}
        <section id="analysis" className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-heading font-semibold text-sm text-[#0F172A] border-b border-slate-100 pb-3">
            學測英文作文常見失誤提醒
          </h3>
          <ul className="list-disc pl-5 text-xs text-[#475569] space-y-2 leading-relaxed">
            <li><b>審題不完整</b>：看圖寫作遺漏重要圖片轉折細節，或主題論述未完整回答引導題幹。</li>
            <li><b>段落缺乏銜接</b>：句子間缺乏轉折詞（如 However, Consequently, In contrast），文字呈現碎片化。</li>
            <li><b>時態混用</b>：敘事故事未統一採用過去時態，或與現在事實說明混合使用造成混淆。</li>
            <li><b>直譯式搭配詞</b>：過度使用中式英文思考（Chinglish），忽略道地英文動詞與介系詞搭配。</li>
          </ul>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-[#475569] mt-12">
        <div className="max-w-5xl mx-auto px-6 space-y-1.5">
          <p className="font-heading font-semibold text-[#0F172A]">CEEC Writing Assessment · Academic Standard</p>
          <p className="text-[11px] text-slate-500">本平台評量標準參照大學入學考試中心（CEEC）公布之非選擇題閱卷規準。</p>
        </div>
      </footer>

    </div>
  );
}