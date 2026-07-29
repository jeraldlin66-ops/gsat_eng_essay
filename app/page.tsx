'use client';

import { useState } from 'react';
import { generateEssayHelp } from './actions';

type MainMode = 'correction' | 'guidance';
type GuidanceType = 'picture' | 'chart' | 'essay' | 'vocab';
type TargetScore = 'under10' | '11to15' | '16to20';

const GUIDANCE_CONFIG: Record<GuidanceType, { label: string; placeholder: string }> = {
  picture: {
    label: '看圖寫作',
    placeholder: '可上傳學測四格漫畫試卷（PDF / JPG），或輸入情境描述...',
  },
  chart: {
    label: '圖表說明',
    placeholder: '可上傳統計圖表試卷，或說明數據趨勢與項目對比...',
  },
  essay: {
    label: '主題論述',
    placeholder: '輸入學測寫作題目、上傳試卷，或描述引導文字...',
  },
  vocab: {
    label: '單字與片語建議',
    placeholder: '輸入寫作主題關鍵字（例如：氣候變遷、青少年壓力、人工智慧應用）...',
  },
};

const SCORE_OPTIONS: { id: TargetScore; label: string; desc: string }[] = [
  { id: 'under10', label: '10 分以下（基礎打底）', desc: '著重基本句型完整度與核心詞彙' },
  { id: '11to15', label: '11 – 15 分（進階提升）', desc: '著重段落銜接、複合句型與道地詞彙' },
  { id: '16to20', label: '16 – 20 分（高分標竿）', desc: '著重精妙破題、高級修辭與深層立意' },
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
    if (file) {
      processFile(file);
    }
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
      alert('評量系統連線異常，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled =
    loading ||
    (!topic.trim() && !fileData) ||
    (mainMode === 'correction' && !userEssay.trim());

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#111111] font-sans antialiased selection:bg-[#2F5D50]/20">
      
      {/* 🏛️ 官方 Header */}
      <header className="bg-[#1E3A5F] text-white border-b border-[#132742]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="border border-white/30 text-white font-medium text-[11px] px-2.5 py-1 rounded tracking-wide">
              CEEC Standard
            </span>
            <div>
              <span className="font-semibold text-base tracking-tight block leading-none font-[#IBM Plex Sans]">
                學測英文作文評量平台
              </span>
              <span className="text-[10px] text-slate-300 tracking-wider block mt-1 uppercase">
                College Entrance Examination Assessment System
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-200 font-medium">
            <a href="#rubric" className="hover:text-white academic-transition">CEEC 評分規準</a>
            <a href="#workflow" className="hover:text-white academic-transition">評量流程</a>
            <a href="#sample" className="hover:text-white academic-transition">標竿範文規範</a>
            <a href="#mistakes" className="hover:text-white academic-transition">常見失誤</a>
          </nav>
        </div>
      </header>

      {/* 🏛️ Hero 區塊 (淡入 + translateY 位移) */}
      <section className="bg-white border-b border-slate-300 py-10 md:py-12 px-6 animate-hero-fade">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="inline-block text-xs font-semibold text-[#1E3A5F] border border-[#1E3A5F]/30 px-2.5 py-0.5 rounded">
            大學入學考試中心（CEEC）學測英文科非選擇題評量標準
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1E3A5F] tracking-tight leading-snug">
            依據 CEEC 學測英文作文評分規準，模擬真實閱卷流程
          </h1>
          <p className="text-slate-700 text-sm leading-relaxed max-w-3xl">
            上傳題目或選擇作文情境，取得符合學測評分邏輯的分項評分、修改建議與高分表達。
          </p>
        </div>
      </section>

      {/* 📌 閱卷流程動畫區塊 (Staggered Step Activation) */}
      <section id="workflow" className="max-w-5xl mx-auto px-6 py-6 animate-section-fade">
        <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-3 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wider">
              系統評量執行流程 (Assessment Workflow)
            </span>
            <span className="text-[11px] text-slate-500">標準作業程序</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="step-item-1 p-3.5 border rounded academic-transition">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5">STEP 01</span>
              <span className="font-semibold text-[#1E3A5F] block">選擇題型</span>
              <span className="text-[11px] text-slate-600">看圖 / 圖表 / 主題論述</span>
            </div>
            
            <div className="step-item-2 p-3.5 border rounded academic-transition">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5">STEP 02</span>
              <span className="font-semibold text-[#1E3A5F] block">上傳題目</span>
              <span className="text-[11px] text-slate-600">PDF、圖片或試卷描述</span>
            </div>

            <div className="step-item-3 p-3.5 border rounded academic-transition">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5">STEP 03</span>
              <span className="font-semibold text-[#1E3A5F] block">輸入作文</span>
              <span className="text-[11px] text-slate-600">輸入學生英文文章內文</span>
            </div>

            <div className="step-item-4 p-3.5 border rounded academic-transition">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5">STEP 04</span>
              <span className="font-semibold text-[#2F5D50] block">取得評分報告</span>
              <span className="text-[11px] text-slate-600">分項得分與逐句診斷</span>
            </div>
          </div>
        </div>
      </section>

      {/* 主體作業區域 */}
      <main className="max-w-5xl mx-auto px-6 pb-16 space-y-6">

        {/* 模式切換標籤 */}
        <div className="flex border-b border-slate-300">
          <button
            onClick={() => {
              setMainMode('correction');
              setGuidanceResult(null);
              setCorrectionResult(null);
            }}
            className={`px-5 py-2.5 text-xs font-semibold academic-transition ${
              mainMode === 'correction'
                ? 'bg-[#1E3A5F] text-white rounded-t'
                : 'bg-white text-slate-600 hover:text-slate-900 border-t border-x border-slate-300'
            }`}
          >
            作文評量 (Essay Assessment)
          </button>
          <button
            onClick={() => {
              setMainMode('guidance');
              setGuidanceResult(null);
              setCorrectionResult(null);
            }}
            className={`px-5 py-2.5 text-xs font-semibold academic-transition ${
              mainMode === 'guidance'
                ? 'bg-[#1E3A5F] text-white rounded-t'
                : 'bg-white text-slate-600 hover:text-slate-900 border-t border-x border-slate-300'
            }`}
          >
            開始發想 (Brainstorming & Guidance)
          </button>
        </div>

        {/* 題型按鈕（Hover 微升 -2px，深邊框） */}
        {mainMode === 'guidance' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-section-fade">
            {(Object.keys(GUIDANCE_CONFIG) as GuidanceType[]).map((key) => {
              const isActive = guidanceType === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setGuidanceType(key);
                    setTopic('');
                  }}
                  className={`p-2.5 text-xs font-medium rounded border text-center academic-transition hover:-translate-y-0.5 ${
                    isActive
                      ? 'bg-[#2F5D50] text-white border-[#2F5D50]'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {GUIDANCE_CONFIG[key].label}
                </button>
              );
            })}
          </div>
        )}

        {/* 程度卡片（選取 scale 1.015、深藍邊框、淡米白背景） */}
        {mainMode === 'guidance' && (
          <div className="bg-white p-5 rounded-lg border border-slate-300 space-y-2 shadow-sm animate-section-fade">
            <label className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wider block">
              設定學生目前程度與評量目標 (Target Band)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SCORE_OPTIONS.map((opt) => {
                const isSelected = targetScore === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTargetScore(opt.id)}
                    className={`p-3.5 rounded border text-left academic-transition ${
                      isSelected
                        ? 'border-[#1E3A5F] bg-[#F7F5EF] text-[#1E3A5F] scale-[1.015] shadow-xs'
                        : 'border-slate-300 bg-white hover:border-slate-400 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[11px] text-slate-600 mt-1 leading-normal">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 輸入卡片區 */}
        <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-5 animate-section-fade">
          
          {/* 1. 拖曳/上傳區塊（背景淡藍、虛線邊框平滑過渡） */}
          <div className="space-y-2 pb-3 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wider">
                1. 題目卷檔案 (PDF / JPG / PNG)
              </label>
              <span className="text-[11px] text-slate-500">可拖曳檔案至下方區域</span>
            </div>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-4 border-2 border-dashed rounded text-center academic-transition ${
                isDragging
                  ? 'border-[#1E3A5F] bg-slate-100'
                  : 'border-slate-300 bg-[#F7F5EF] hover:border-slate-400'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-1.5">
                <span className="text-xs text-slate-700 font-medium">
                  將題目卷檔案拖曳至此，或點擊下方按鈕上傳
                </span>
                
                <label className="cursor-pointer px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-semibold academic-transition shadow-2xs hover:-translate-y-0.5">
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
                <div className="mt-3 inline-flex items-center gap-2 bg-[#EBF2EE] border border-[#2F5D50]/30 px-3 py-1 rounded text-xs text-[#2F5D50] academic-transition">
                  <span>已載入題目檔案：{fileData.name}</span>
                  <button
                    onClick={() => setFileData(null)}
                    className="ml-2 text-rose-700 font-bold hover:text-rose-900"
                  >
                    重設
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. 題目描述 */}
          <div className="space-y-1.5">
            <label htmlFor="topic-input" className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wider block">
              2. 作文題目描述
            </label>
            <textarea
              id="topic-input"
              rows={mainMode === 'guidance' ? 3 : 2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                fileData
                  ? '已載入試卷檔案，系統將自動閱讀解讀；可於此補充說明...'
                  : GUIDANCE_CONFIG[guidanceType].placeholder
              }
              className="w-full bg-[#F7F5EF] border border-slate-300 rounded p-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#1E3A5F] text-xs leading-relaxed resize-none academic-transition"
            />
          </div>

          {/* 3. 作文內文 */}
          {mainMode === 'correction' && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <label htmlFor="essay-input" className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wider">
                  3. 學生英文作文內文 (Student Essay)
                </label>
                <span className="text-[11px] text-slate-500 font-mono">{userEssay.length} 字</span>
              </div>
              <textarea
                id="essay-input"
                rows={8}
                value={userEssay}
                onChange={(e) => setUserEssay(e.target.value)}
                placeholder="請貼上學生英文作文全文..."
                className="w-full bg-[#F7F5EF] border border-slate-300 rounded p-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#1E3A5F] text-xs leading-relaxed font-mono resize-none academic-transition"
              />
            </div>
          )}

          {/* CTA 按鈕（Hover 陰影輕微增加，不滑動不跳動） */}
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className="w-full py-3 bg-[#1E3A5F] hover:bg-[#132742] hover:shadow-md disabled:bg-slate-300 disabled:text-slate-500 font-semibold rounded text-white text-xs tracking-wider academic-transition"
          >
            {loading ? '系統評量中，請稍候...' : mainMode === 'correction' ? '執行作文評量' : '開始發想'}
          </button>
        </div>

        {/* 評量結果：發想模式 */}
        {guidanceResult && !loading && (
          <div className="space-y-4 animate-section-fade">
            {guidanceResult.theme && (
              <div className="p-5 bg-white border border-slate-300 rounded space-y-2 shadow-xs">
                <div className="text-xs font-semibold text-[#1E3A5F] border-b border-slate-200 pb-1">
                  審題要旨與寫作方向
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: guidanceResult.theme }} />
              </div>
            )}

            {guidanceResult.outline && (
              <div className="p-5 bg-white border border-slate-300 rounded space-y-2 shadow-xs">
                <div className="text-xs font-semibold text-[#1E3A5F] border-b border-slate-200 pb-1">
                  段落發展與常用句型
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: guidanceResult.outline }} />
              </div>
            )}

            {guidanceResult.vocab && (
              <div className="p-5 bg-white border border-slate-300 rounded space-y-2 shadow-xs">
                <div className="text-xs font-semibold text-[#2F5D50] border-b border-slate-200 pb-1">
                  單字與片語建議
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: guidanceResult.vocab }} />
              </div>
            )}
          </div>
        )}

        {/* 評量結果：作文評量報告 */}
        {correctionResult && !loading && (
          <div className="space-y-5 animate-section-fade">
            
            <div className="p-6 bg-white border border-slate-300 rounded space-y-4 shadow-sm">
              <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                    CEEC 標準模擬總分
                  </span>
                  <span className="text-3xl font-semibold text-[#1E3A5F] font-mono mt-0.5 block">
                    {correctionResult.score}
                  </span>
                </div>
                <span className="text-xs text-slate-500">滿分：20.0 分</span>
              </div>

              <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: correctionResult.summary }} />
            </div>

            {correctionResult.errors && (
              <div className="p-6 bg-white border border-slate-300 rounded space-y-3 shadow-xs">
                <div className="text-xs font-semibold text-rose-800 border-b border-slate-200 pb-1">
                  逐句語法與用字修改對照
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: correctionResult.errors }} />
              </div>
            )}

            {correctionResult.modelEssay && (
              <div className="p-6 bg-white border border-slate-300 rounded space-y-3 shadow-xs">
                <div className="text-xs font-semibold text-[#1E3A5F] border-b border-slate-200 pb-1">
                  學測高分標竿範文與解析 (16–18 分級別)
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: correctionResult.modelEssay }} />
              </div>
            )}

          </div>
        )}

        {/* 📊 CEEC 四大評分維度 */}
        <section id="rubric" className="bg-white p-6 rounded-lg border border-slate-300 space-y-3 shadow-2xs">
          <h3 className="text-sm font-semibold text-[#1E3A5F] border-b border-slate-200 pb-2">
            CEEC 大考中心英文作文評分維度說明 (Assessment Criteria)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
            <div className="p-3 bg-[#F7F5EF] border border-slate-200 rounded">
              <span className="font-semibold text-[#1E3A5F] block mb-1">1. 內容 (Content) — 5分</span>
              評估切題度、情境發展完整性、論據是否充足且符合題目引導要求。
            </div>
            <div className="p-3 bg-[#F7F5EF] border border-slate-200 rounded">
              <span className="font-semibold text-[#1E3A5F] block mb-1">2. 組織 (Organization) — 5分</span>
              評估文章結構（引言、發展、結論）連貫度、段落銜接與轉折語詞運用。
            </div>
            <div className="p-3 bg-[#F7F5EF] border border-slate-200 rounded">
              <span className="font-semibold text-[#1E3A5F] block mb-1">3. 文法句構 (Grammar & Structures) — 5分</span>
              評估句型多樣性（如複合句、分詞構句）與文法、時態正確度。
            </div>
            <div className="p-3 bg-[#F7F5EF] border border-slate-200 rounded">
              <span className="font-semibold text-[#1E3A5F] block mb-1">4. 字彙拼字 (Vocabulary & Spelling) — 5分</span>
              評估用字精準度與豐富度（CEFR B1-B2 程度），以及拼字與大小寫標點之正確性。
            </div>
          </div>
        </section>

        {/* ⚠️ 常見失誤 */}
        <section id="mistakes" className="bg-white p-6 rounded-lg border border-slate-300 space-y-3 shadow-2xs">
          <h3 className="text-sm font-semibold text-[#1E3A5F] border-b border-slate-200 pb-2">
            歷年學測英文作文常見失誤統計 (Common Student Errors)
          </h3>
          <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1.5 leading-relaxed">
            <li><b>審題不精準</b>：看圖寫作未處理圖片關鍵細節轉折，或主題論述偏離題目指定提問。</li>
            <li><b>段落銜接欠佳</b>：未適當使用轉折詞（如 However, Therefore, In contrast），導致上下文邏輯跳躍。</li>
            <li><b>時態混淆</b>：故事敘述未統一使用過去時態，或與現在事實說明混合使用。</li>
            <li><b>過度使用直譯中文句型</b>：使用中式英文（Chinglish），忽略道地英文動詞搭配（Collocation）。</li>
          </ul>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-300 bg-white py-6 text-center text-xs text-slate-600">
        <div className="max-w-5xl mx-auto px-6 space-y-1">
          <p className="font-semibold text-[#1E3A5F]">學測英文作文評量平台 · CEEC Evaluation Standard System</p>
          <p className="text-[11px] text-slate-500">本平台評量標準參照財團法人大學入學考試中心基金會（CEEC）公布之非選擇題閱卷規準。</p>
        </div>
      </footer>

    </div>
  );
}