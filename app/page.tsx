'use client';

import { useState } from 'react';
import { generateEssayHelp } from './actions';

type MainMode = 'correction' | 'guidance';
type GuidanceType = 'picture' | 'chart' | 'essay' | 'vocab';

const GUIDANCE_CONFIG: Record<GuidanceType, { label: string; placeholder: string }> = {
  picture: {
    label: '看圖寫作',
    placeholder: '可上傳學測四格漫畫題目卷（PDF / JPG），或輸入情境說明...',
  },
  chart: {
    label: '圖表說明',
    placeholder: '可上傳統計圖表題目卷，或說明數據變化趨勢與項目比較...',
  },
  essay: {
    label: '主題論述',
    placeholder: '輸入學測寫作題目、上傳題目卷，或描述引導文字...',
  },
  vocab: {
    label: '單字與片語建議',
    placeholder: '輸入寫作主題（例如：環境永續、青少年壓力、社群媒體使用）...',
  },
};

export default function Home() {
  const [mainMode, setMainMode] = useState<MainMode>('correction');
  const [guidanceType, setGuidanceType] = useState<GuidanceType>('picture');
  
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

      const res = await generateEssayHelp(mainMode, subTypeName, '11to15', topic, userEssay, filePayload);

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
      
      {/* 官方頂部 Header */}
      <header className="bg-[#1E3A5F] text-white border-b border-[#132742]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="border border-white/30 text-white font-semibold text-xs px-2.5 py-1 rounded">
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
            <a href="#rubric" className="hover:text-white transition">CEEC 評分規準</a>
            <a href="#workflow" className="hover:text-white transition">評量流程</a>
            <a href="#sample" className="hover:text-white transition">標竿範文規範</a>
            <a href="#mistakes" className="hover:text-white transition">常見失誤</a>
          </nav>
        </div>
      </header>

      {/* 官方 Hero 區塊 */}
      <section className="bg-white border-b border-slate-300 py-10 md:py-12 px-6">
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

      {/* 📌 流程式資訊架構 (Workflow) */}
      <section id="workflow" className="max-w-5xl mx-auto px-6 py-6">
        <div className="bg-white border border-slate-300 rounded-lg p-4">
          <span className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wider block mb-3 border-b border-slate-200 pb-1">
            評量執行流程 (Assessment Workflow)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#F7F5EF] border border-slate-200 rounded">
              <span className="font-semibold text-[#1E3A5F] block mb-1">Step 1. 選擇題型</span>
              看圖寫作 / 圖表說明 / 主題論述
            </div>
            <div className="p-3 bg-[#F7F5EF] border border-slate-200 rounded">
              <span className="font-semibold text-[#1E3A5F] block mb-1">Step 2. 上傳題目</span>
              試卷 PDF、圖片或文字說明
            </div>
            <div className="p-3 bg-[#F7F5EF] border border-slate-200 rounded">
              <span className="font-semibold text-[#1E3A5F] block mb-1">Step 3. 輸入作文</span>
              貼上學生英文作文內文
            </div>
            <div className="p-3 bg-[#F7F5EF] border border-slate-200 rounded">
              <span className="font-semibold text-[#2F5D50] block mb-1">Step 4. 取得評分報告</span>
              四維度評分與逐句修改建議
            </div>
          </div>
        </div>
      </section>

      {/* 主體作業區域 */}
      <main className="max-w-5xl mx-auto px-6 pb-16 space-y-6">

        {/* 模式頁籤 */}
        <div className="flex border-b border-slate-300">
          <button
            onClick={() => {
              setMainMode('correction');
              setGuidanceResult(null);
              setCorrectionResult(null);
            }}
            className={`px-5 py-2.5 text-xs font-semibold transition ${
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
            className={`px-5 py-2.5 text-xs font-semibold transition ${
              mainMode === 'guidance'
                ? 'bg-[#1E3A5F] text-white rounded-t'
                : 'bg-white text-slate-600 hover:text-slate-900 border-t border-x border-slate-300'
            }`}
          >
            開始發想 (Brainstorming & Guidance)
          </button>
        </div>

        {/* 子分類 (發想模式) */}
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
                  className={`p-2 text-xs font-medium rounded border text-center transition ${
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

        {/* 輸入卡片區 */}
        <div className="bg-white p-6 rounded-lg border border-slate-300 space-y-5">
          
          {/* 1. 題目檔案 */}
          <div className="space-y-2 pb-3 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wider">
                1. 題目卷檔案 (PDF / JPG / PNG)
              </label>
              <span className="text-[11px] text-slate-500">選填</span>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3 py-1.5 bg-[#F7F5EF] hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-medium transition">
                上傳題目檔案
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {fileData && (
                <div className="flex items-center gap-2 bg-[#EBF2EE] border border-[#2F5D50]/30 px-2.5 py-1 rounded text-xs text-[#2F5D50]">
                  <span>已夾帶檔案：{fileData.name}</span>
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
              rows={modeIsGuidance(mainMode) ? 3 : 2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                fileData
                  ? '已夾帶試卷檔案，系統將自動解讀；可於此補充額外指示...'
                  : GUIDANCE_CONFIG[guidanceType].placeholder
              }
              className="w-full bg-[#F7F5EF] border border-slate-300 rounded p-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#1E3A5F] text-xs leading-relaxed resize-none"
            />
          </div>

          {/* 3. 作文全文 (僅評量模式) */}
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
                placeholder="請輸入或貼上學生英文作文全文..."
                className="w-full bg-[#F7F5EF] border border-slate-300 rounded p-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#1E3A5F] text-xs leading-relaxed font-mono resize-none"
              />
            </div>
          )}

          {/* 執行按鈕 */}
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className="w-full py-3 bg-[#1E3A5F] hover:bg-[#132742] disabled:bg-slate-300 disabled:text-slate-500 font-semibold rounded text-white text-xs tracking-wider transition duration-150"
          >
            {loading ? '分析處理中，請稍候...' : mainMode === 'correction' ? '執行作文評量' : '開始發想'}
          </button>
        </div>

        {/* 評量結果：發想模式 */}
        {guidanceResult && !loading && (
          <div className="space-y-4">
            {guidanceResult.theme && (
              <div className="p-5 bg-white border border-slate-300 rounded space-y-2">
                <div className="text-xs font-semibold text-[#1E3A5F] border-b border-slate-200 pb-1">
                  審題要旨與寫作方向
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: guidanceResult.theme }} />
              </div>
            )}

            {guidanceResult.outline && (
              <div className="p-5 bg-white border border-slate-300 rounded space-y-2">
                <div className="text-xs font-semibold text-[#1E3A5F] border-b border-slate-200 pb-1">
                  段落發展與常用句型
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: guidanceResult.outline }} />
              </div>
            )}

            {guidanceResult.vocab && (
              <div className="p-5 bg-white border border-slate-300 rounded space-y-2">
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
          <div className="space-y-5">
            
            {/* 總分與診斷 */}
            <div className="p-6 bg-white border border-slate-300 rounded space-y-4">
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

            {/* 逐句修改對照 */}
            {correctionResult.errors && (
              <div className="p-6 bg-white border border-slate-300 rounded space-y-3">
                <div className="text-xs font-semibold text-rose-800 border-b border-slate-200 pb-1">
                  逐句語法與用字修改對照
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: correctionResult.errors }} />
              </div>
            )}

            {/* 高分標竿範文 */}
            {correctionResult.modelEssay && (
              <div className="p-6 bg-white border border-slate-300 rounded space-y-3">
                <div className="text-xs font-semibold text-[#1E3A5F] border-b border-slate-200 pb-1">
                  學測高分標竿範文與解析 (16–18 分級別)
                </div>
                <div className="text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: correctionResult.modelEssay }} />
              </div>
            )}

          </div>
        )}

        {/* 📊 CEEC 四大評分維度說明 */}
        <section id="rubric" className="bg-white p-6 rounded-lg border border-slate-300 space-y-3">
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

        {/* ⚠️ 常見失誤分析 */}
        <section id="mistakes" className="bg-white p-6 rounded-lg border border-slate-300 space-y-3">
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

function modeIsGuidance(mode: MainMode): boolean {
  return mode === 'guidance';
}