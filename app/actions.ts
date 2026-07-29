'use server';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

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
    const prompt = `${visionPromptIntro}${formattingInstruction}你是一位大考中心學測英文閱卷顧問。請針對題目【${topic || '詳見上傳試卷'}】，提供寫作發想與素材：

===GUIDANCE_THEME===
<h4>一、 審題要旨與寫作方向</h4>
<p>(剖析題目核心訴求、圖片轉折或圖表重點，給予切題的寫作立意與發展脈絡)</p>

===GUIDANCE_OUTLINE===
<h4>二、 段落發展與常用句型</h4>
<p>(提供符合學測兩段式寫作之結構說明與銜接轉折語彙)</p>

===GUIDANCE_VOCAB===
<h4>三、 單字與片語建議</h4>
<p>(提供 6-8 個適合學測 B1-B2 程度之精準詞彙與常用片語，附中文釋義與例句說明)</p>
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
    const prompt = `${visionPromptIntro}${formattingInstruction}你是一位大考中心（CEEC）學測英文作文閱卷委員。請依據「CEEC 學測英文作文評分標準（內容5分、組織5分、文法句構5分、字彙拼字5分，總分20分）」對學生作文進行完整評量與修正診斷。

【作文題目/題目卷】：
${topic || '請參閱上傳之題目卷'}

【學生作文內文】：
${userEssay}

【標竿範文寫作規則】：
生成之範文必須為「高中生可學習模仿之學測高分作文（約16-18分等級）」，非 GRE/SAT 滿分作文。
1. 長度：200–300 字，約 12–16 句。
2. 難度：CEFR B1–B2 程度，使用高中生自然會寫的字彙與句型，避免艱深罕見字與過度複雜之長難句。
3. 結構：引言 -> 兩個主要理由/例子 -> 結論。

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
<p>(詳細說明整體文章優勢、主要失分要點與後續練習建議)</p>

===SECTION_ERRORS===
<h4>三、 逐句診斷與修訂對照</h4>
<p>(列出需修正之原句、優化後建議與修訂理由說明)</p>

===SECTION_MODEL===
<h4>四、 高分標竿範文與解析</h4>
<div className="bg-[#F7F5EF] p-4 border border-slate-300 rounded my-3">
  <p className="font-bold text-[#1E3A5F] mb-1">【題目】</p>
  <p className="mb-3">${topic || '學測英文作文題目'}</p>
  <p className="font-bold text-[#1E3A5F] mb-1">【範文（200–300 字）】</p>
  <p className="font-serif leading-relaxed mb-4 text-[#111111]">[請在此輸出符合 B1-B2 程度、200-300字之範文]</p>
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