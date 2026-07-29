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
    return { error: '⚠️ 系統連線異常，請聯繫管理員確認金鑰設定。' };
  }

  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: apiKey,
  });

  let visionPromptIntro = '';
  if (fileData) {
    visionPromptIntro = `【題目卷與圖表閱讀指示】：
學生已上傳題目卷或圖表檔案。請務必詳細閱讀：
1. 精準辨識題目引導文字、四格漫畫劇情轉折或圖表數據對比。
2. 即使未提供文字描述，請完全依據題目卷檔案之內容進行專業分析。\n\n`;
  }

  const formattingInstruction = `
【排版與用語規範】：
1. 嚴禁使用任何 Markdown 符號（如 #, ##, ***, **, * 等）。
2. 請使用專業教育評量語氣，切勿出現「作為AI模型」、「Prompt」、「多模態」等科技字眼。
3. 重要詞彙與修正請直接使用 HTML 粗體與標籤：
   - 高分詞彙：<b class="text-[#2F5D50] bg-[#EBF2EE] px-1.5 py-0.5 rounded font-semibold">單字</b>
   - 錯字對照：<span class="text-rose-700 bg-rose-50 px-1 py-0.5 rounded">原錯字</span> ➔ <b class="text-[#2F5D50] bg-[#EBF2EE] px-1 py-0.5 rounded">建議修正</b>
4. 請使用結構化的 HTML（<h4>, <p>, <ul>, <li>, <ol>）來呈現如考試院/大考中心公報般的清晰排版。
`;

  if (mode === 'guidance') {
    const scoreMap: Record<string, string> = {
      under10: '10 分以下（基礎建構：鞏固基本句型與核心詞彙）',
      '11to15': '11–15 分（進階展現：強化段落銜接與轉折片語）',
      '16to20': '16–20 分（頂尖標竿：精準破題、豐富修辭與高階表達）',
    };
    const targetDescription = scoreMap[targetScore] || scoreMap['11to15'];

    if (subType === '常用詞彙與句型發想') {
      const prompt = `${visionPromptIntro}${formattingInstruction}你是一位大考中心學測英文閱卷顧問。請針對題目【${topic || '詳見上傳試卷'}】，目標分數區間設定為【${targetDescription}】，提供高分寫作素材庫：

===GUIDANCE_VOCAB===
<h4>一、 核心主題高分詞彙 (Key Vocabulary)</h4>
(提供 6–8 個適合學測的高階詞彙，含音標、中文釋義與說明應用情境)

<h4>二、 段落銜接與轉折片語 (Phrases & Transitions)</h4>
(提供 4–5 個能提升文章組織度的道地片語及寫作範例)

<h4>三、 萬用名言與論述佳句 (Quotes & Expressions)</h4>
(提供 3 則可融入寫作的主題名言或諺語，並提供修辭建議)
`;

      try {
        const { text } = await generateText({
          model: groq('llama-3.3-70b-versatile'),
          prompt: prompt,
        });

        const vocabMatch = text.match(/===GUIDANCE_VOCAB===([\s\S]*?)$/);
        return {
          guidanceResult: {
            theme: '',
            outline: '',
            vocab: vocabMatch ? vocabMatch[1].trim() : text,
          },
        };
      } catch (error) {
        console.error('Error:', error);
        return { error: '評量模組暫時無法回應，請稍後再試。' };
      }
    } else {
      const prompt = `${visionPromptIntro}${formattingInstruction}你是一位大考中心學測英文閱卷顧問。請針對【${subType}】題目【${topic || '詳見上傳試卷'}】，目標分數區間設定為【${targetDescription}】，提供寫作架構引導：

===GUIDANCE_THEME===
<h4>一、 破題立意與審題觀念 (Theme & Exposition)</h4>
(剖析題目核心訴求、圖片轉折或圖表重點，給予切題的立意方向)

===GUIDANCE_OUTLINE===
<h4>二、 段落發展與建議句型 (Paragraph Outline)</h4>
(針對第一段與第二段，給予邏輯鋪陳架構與必備高分句型)

===GUIDANCE_VOCAB===
<h4>三-[#2F5D50] 推薦詞彙與表達補給 (Vocabulary & Idioms)</h4>
(提供符合該目標得分區間的精準詞彙、進階片語與延伸句型)
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
    }
  } else {
    // 全文評量模式
    const prompt = `${visionPromptIntro}${formattingInstruction}你是一位嚴謹的大考中心（CEEC）學測英文作文閱卷委員。請依據「CEEC 學測英文作文評分標準（內容5分、組織5分、文法句構5分、字彙拼字5分）」對學生作文進行完整評量與修正診斷。

【作文題目/題目卷】：
${topic || '請參閱上傳之題目卷'}

【學生作文內文】：
${userEssay}

===SECTION_SUMMARY===
SCORE: [請在此處僅填寫總分數字/20，例如：14.5/20]
<h4>一、 大考中心四大維度分項評分 (CEEC Evaluation Criteria)</h4>
<ul>
  <li><b>內容 (Content)</b>： [ / 5 分] — 檢視是否切題、發揮是否充實。</li>
  <li><b>組織 (Organization)</b>： [ / 5 分] — 檢視段落分明度、銜接詞運用與邏輯連貫性。</li>
  <li><b>文法句構 (Grammar & Structures)</b>： [ / 5 分] — 檢視句型多樣性與時態/文法正確度。</li>
  <li><b>字彙拼字 (Vocabulary & Spelling)</b>： [ / 5 分] — 檢視用詞精準度、拼字與標點符號。</li>
</ul>

<h4>二、 閱卷委員綜合診斷與進步建議 (Examiner Feedback)</h4>
(說明整體文章亮點、主要失分原因與後續練習重點)

===SECTION_ERRORS===
<h4>三、 逐句診斷與修訂對照 (Detailed Corrections)</h4>
(按段落列出需改進的句子、提供優化後的表現方式，並標註修訂理由)

===SECTION_MODEL===
<h4>四、 高分標竿範文與分析 (Benchmark Essay - 16+ 分)</h4>
(提供一篇結構完整、修辭嚴謹且符合 CEEC 高分規準的範例作文)
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