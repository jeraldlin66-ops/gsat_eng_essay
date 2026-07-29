'use server';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

type TargetScore = 'under10' | '11to15' | '16to20';

const TARGET_SCORE_GUIDANCE: Record<TargetScore, { label: string; instruction: string }> = {
  under10: {
    label: '10 分以下：基礎建構',
    instruction: `
【目標級分：10 分以下】
學生現階段的首要目標是「完成切題、正確且可理解的兩段式作文」，不要堆砌難字或複雜句。
- 審題：只選一個明確觀點或依題圖順序敘述，列出每段一定要寫到的 2–3 個重點。
- 段落：每段 3–4 句；提供可直接代換的短句模板，以主詞＋動詞＋受詞為主。
- 句構：只示範現在式、過去式、because 與 so；每段最多一個簡單複句。
- 字彙：提供 6 個 A2–B1 常用字或片語；每個都要附非常短的可套用例句。
- 練習：明確指出「先避免的錯誤」與「本次只要做到的一件事」。`,
  },
  '11to15': {
    label: '11–15 分：穩定發展',
    instruction: `
【目標級分：11–15 分】
學生的目標是寫出內容完整、脈絡清楚的兩段式作文，並以例子支撐觀點。
- 審題：提出一個清楚主張，並規畫兩個理由、例子或圖像細節。
- 段落：每段 4–5 句，需有主題句、說明與收束句；標示可使用的轉折語。
- 句構：示範 because/although/when 引導的複句，以及一個自然的比較或關係子句。
- 字彙：提供 6–8 個 B1–B2 常用搭配詞，附中文釋義與貼合本題的例句。
- 練習：指出如何把基礎句改得更完整，但避免罕見字與冗長句。`,
  },
  '16to20': {
    label: '16–20 分：精準深化',
    instruction: `
【目標級分：16–20 分】
學生的目標是用精準立意、細節推論與自然多變的句構，寫出有層次但仍符合高中程度的文章。
- 審題：提出具辨識度的中心觀點；針對圖像轉折或數據，加入原因、影響或對比的推論。
- 段落：每段 5–6 句，安排有力的開頭、具體細節、讓步或轉折，並回扣題旨。
- 句構：示範條件句、讓步句、分詞片語或較精準的比較句；每個句型都要自然、可模仿，不能為炫技而過度複雜。
- 字彙：提供 8 個 B2 程度的精準搭配詞與替換字，附中文釋義及貼合本題的例句。
- 練習：說明如何提升觀點深度、銜接與用字精準度，避免只羅列華麗詞彙。`,
  },
};

function countEnglishWords(text: string) {
  return text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)?.length ?? 0;
}

export async function generateEssayHelp(
  mode: 'guidance' | 'correction',
  subType: string,
  targetScore: string,
  topic: string,
  userEssay?: string,
  fileData?: { base64: string; mimeType: string }
) {
  const apiKey = process.env.GROQ_API_KEY2 || process.env.GROQ_API_KEY;

  if (!apiKey) {
    return { error: '系統連線異常，請確認伺服器金鑰設定。' };
  }

  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: apiKey,
  });

  let visionPromptIntro = '';
  if (fileData) {
    visionPromptIntro = `【題目卷與圖表閱讀指示】：
學生已上傳題目卷或圖表檔案。請詳細閱覽檔案內容，辨識題目引導文字、四格漫畫劇情轉折或圖表數據對比。\n\n`;
  }

  const formattingInstruction = `
【排版與語言規範】：
1. 嚴禁使用任何 emoji、表情符號、圖示符號（如 🚀, ✨, 💡, 📝, ✅ 等）。
2. 使用權威教育評量語氣，切勿出現「作為AI模型」、「Prompt」、「多模態」等科技字眼。
3. 請使用結構化的 HTML（<h4>, <p>, <table>, <ul>, <li>, <ol>）來呈現如考試院/大考中心公報般的清晰排版。
4. HTML 標籤內請使用專用類別：
   - 建議修正：<span class="text-rose-800 bg-rose-50 px-1 py-0.5 border border-rose-200">原錯字</span> -> <b class="text-[#2F5D50] bg-[#EBF2EE] px-1 py-0.5 border border-[#2F5D50]/30 font-semibold">建議修正</b>
`;

  if (mode === 'guidance') {
    const selectedTarget = TARGET_SCORE_GUIDANCE[targetScore as TargetScore] ?? TARGET_SCORE_GUIDANCE['11to15'];
    const prompt = `${visionPromptIntro}${formattingInstruction}你是一位大考中心學測英文閱卷顧問。請針對題目【${topic || '詳見上傳試卷'}】，提供寫作發想與素材。

${selectedTarget.instruction}

【嚴格區隔規則】
本次輸出必須完全符合「${selectedTarget.label}」的難度與教學重點。不要同時提供其他級分的句型、字彙或建議；尤其不可將 16–20 分的複雜句型放入 10 分以下的建議。

===GUIDANCE_THEME===
<h4>一、 審題要旨與寫作方向</h4>
<p>(先以一句話說明本次「${selectedTarget.label}」的寫作目標，再依此級分剖析題目核心、圖片轉折或圖表重點)</p>

===GUIDANCE_OUTLINE===
<h4>二、 段落發展與常用句型</h4>
<p>(依此級分規劃兩段式結構；每段提供具體寫作任務與 2 個符合該級分的可模仿句型)</p>

===GUIDANCE_VOCAB===
<h4>三、 單字與片語建議</h4>
<p>(只提供符合本目標級分的字彙、片語與例句；結尾附上一項最優先的練習任務)</p>
`;

    try {
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: prompt,
      });

      const themeMatch = text.match(/===GUIDANCE_THEME===([\s\S]*?)(?====GUIDANCE_OUTLINE===|$)/);
      const outlineMatch = text.match(/===GUIDANCE_OUTLINE===([\s\S]*?)(?====GUIDANCE_VOCAB===|$)/);
      const vocabMatch = text.match(/===GUIDANCE_VOCAB===([\s\S]*?)$/);

      return {
        guidanceResult: {
          theme: themeMatch ? themeMatch[1].trim() : text,
          outline: outlineMatch ? outlineMatch[1].trim() : '',
          vocab: vocabMatch ? vocabMatch[1].trim() : '',
        },
      };
    } catch (error) {
      console.error('Error:', error);
      return { error: '評量模組暫時無法回應，請稍後再試。' };
    }
  } else {
    // 全文評量模式
    const essayWordCount = countEnglishWords(userEssay ?? '');
    const prompt = `${visionPromptIntro}${formattingInstruction}你是一位大考中心（CEEC）學測英文作文閱卷委員。請依據「CEEC 學測英文作文評分標準（內容5分、組織5分、文法句構5分、字彙拼字5分，總分20分）」對學生作文進行完整評量與修正診斷。

【作文題目/題目卷】：
${topic || '請參閱上傳之題目卷'}

【學生作文內文】：
${userEssay}

【篇幅檢核】：
此篇作文共有約 ${essayWordCount} 個英文單字。請把篇幅納入「內容」與「組織」兩個維度的評分，並在綜合診斷中明確說明篇幅是否足以完整回應題目。
- 若少於 120 個英文單字，除非題目明確要求短答，必須視為發展不足；即使文法正確，內容與組織也不可給高分。
- 若有 120–149 字，說明是否仍缺少必要細節、例子或段落發展。
- 若有 150–300 字，以內容完整度與組織品質為主，不因單純字數扣分。
- 若超過 300 字，檢視是否因冗長、重複或失焦而影響組織與切題性。
字數不是第五個評分項目，不要額外加分或扣分；它必須實際反映在內容與組織分數及評語中。

【標竿範文寫作規則】：
生成之範文必須為「高中生可學習模仿之學測高分作文（約16-18分等級）」，非 GRE/SAT 滿分作文。
1. 長度：200–300 字，約 12–16 句。
2. 難度：CEFR B1–B2 程度，使用高中生自然會寫的字彙與句型，避免艱深罕見字與過度複雜之長難句。
3. 結構：引言 -> 兩個主要理由/例子 -> 結論。
4. 範文本文必須完全使用英文；不得出現中文翻譯、中文句子或中文註解。中文只能用於範文後的得分解析與詞彙說明。

===SECTION_SUMMARY===
SCORE: [請僅填寫數字/20，例如：14.5/20]
<h4>一、 CEEC 四大維度分項評分報告</h4>
<table className="w-full text-left border-collapse my-3">
  <thead>
    <tr className="border-b border-slate-300 bg-slate-100">
      <th className="p-2 border border-slate-300">評分維度</th>
      <th className="p-2 border border-slate-300">得分</th>
      <th className="p-2 border border-slate-300">評語與說明</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="p-2 border border-slate-300 font-bold">內容 (Content)</td>
      <td className="p-2 border border-slate-300 font-mono"> / 5.0</td>
      <td className="p-2 border border-slate-300">檢視切題度與情境敘述完整性。</td>
    </tr>
    <tr>
      <td className="p-2 border border-slate-300 font-bold">組織 (Organization)</td>
      <td className="p-2 border border-slate-300 font-mono"> / 5.0</td>
      <td className="p-2 border border-slate-300">檢視段落連貫性與轉折詞運用。</td>
    </tr>
    <tr>
      <td className="p-2 border border-slate-300 font-bold">文法句構 (Grammar & Structures)</td>
      <td className="p-2 border border-slate-300 font-mono"> / 5.0</td>
      <td className="p-2 border border-slate-300">檢視句型變化與文法正確度。</td>
    </tr>
    <tr>
      <td className="p-2 border border-slate-300 font-bold">字彙拼字 (Vocabulary & Spelling)</td>
      <td className="p-2 border border-slate-300 font-mono"> / 5.0</td>
      <td className="p-2 border border-slate-300">檢視用字精準度與拼字標點。</td>
    </tr>
  </tbody>
</table>

<h4>二、 閱卷綜合診斷與修改建議</h4>
<p><b>篇幅檢核：</b>本篇約 ${essayWordCount} 個英文單字；(說明此篇幅如何影響內容與組織分數)</p>
<p>(詳細說明整體文章優勢、主要失分要點與後續練習建議)</p>

===SECTION_ERRORS===
<h4>三、 逐句診斷與修訂對照</h4>
<p>(列出需修正之原句、優化後建議與修訂理由說明)</p>

===SECTION_MODEL===
<h4>四、 高分標竿範文與解析</h4>
<div className="bg-[#F7F5EF] p-4 border border-slate-300 rounded my-3">
  <p className="font-bold text-[#1E3A5F] mb-1">【題目】</p>
  <p className="mb-3">${topic || '學測英文作文題目'}</p>
  <p className="font-bold text-[#1E3A5F] mb-1">【範文（200–300 字，英文）】</p>
  <p lang="en" className="font-serif leading-relaxed mb-4 text-[#111111]">[Write the 200–300-word model essay in English only. Do not include Chinese in this paragraph.]</p>
  <p className="font-bold text-[#1E3A5F] mb-1">【得分要點解析（100–150 字）】</p>
  <p className="mb-4">[說明此範文符合高分規準之原因]</p>
  <p className="font-bold text-[#1E3A5F] mb-1">【五個可套用句型】</p>
  <ol className="list-decimal pl-5 mb-4 space-y-1">
    <li>句型一...</li>
    <li>句型二...</li>
    <li>句型三...</li>
    <li>句型四...</li>
    <li>句型五...</li>
  </ol>
  <p className="font-bold text-[#1E3A5F] mb-1">【三個建議替換字彙（中英對照）】</p>
  <ul className="list-disc pl-5 space-y-1">
    <li><b>單字 1</b> (中文) - 說明</li>
    <li><b>單字 2</b> (中文) - 說明</li>
    <li><b>單字 3</b> (中文) - 說明</li>
  </ul>
</div>
`;

    try {
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: prompt,
      });

      const summaryMatch = text.match(/===SECTION_SUMMARY===([\s\S]*?)(?====SECTION_ERRORS===|$)/);
      const errorsMatch = text.match(/===SECTION_ERRORS===([\s\S]*?)(?====SECTION_MODEL===|$)/);
      const modelMatch = text.match(/===SECTION_MODEL===([\s\S]*?)$/);

      let rawSummary = summaryMatch ? summaryMatch[1].trim() : text;
      let scoreText = '';
      
      const scoreLine = rawSummary.match(/SCORE:\s*(\d+(?:\.\d+)?\s*\/\s*20)/i);
      if (scoreLine) {
        scoreText = scoreLine[1];
        rawSummary = rawSummary.replace(/SCORE:\s*\d+(?:\.\d+)?\s*\/\s*20/i, '').trim();
      }

      return {
        correctionResult: {
          score: scoreText || '14.0/20',
          wordCount: essayWordCount,
          summary: rawSummary,
          errors: errorsMatch ? errorsMatch[1].trim() : '',
          modelEssay: modelMatch ? modelMatch[1].trim() : '',
        },
      };
    } catch (error) {
      console.error('Error:', error);
      return { error: '評量模組暫時無法回應，請稍後再試。' };
    }
  }
}
