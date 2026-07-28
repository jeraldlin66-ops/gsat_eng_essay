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
    return { error: '⚠️ 尚未檢測到 API Key，請先設定環境變數。' };
  }

  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: apiKey,
  });

  let visionPromptIntro = '';
  if (fileData) {
    visionPromptIntro = `【重要：多模態影像/PDF文件閱讀指令】
使用者上傳了題目圖片或 PDF 題目卷。請務必極度仔細辨識檔案內容：
1. 精準辨識印刷文字、題目指示、圖表數據或四格漫畫的視覺細節。
2. 即使使用者未提供文字描述，請完全依據檔案內容進行權威分析。\n\n`;
  }

  // 格式與排版規範（ETS 規範：禁止 Raw Markdown 符號）
  const formattingInstruction = `
【極重要文字排版規範】：
1. 嚴禁使用任何 Markdown 符號（如 #, ##, ***, **, * 等）。
2. 強調重點單字或關鍵字時，請統一使用 HTML 粗體與顏色標籤：
   - 關鍵單字/片語：<b class="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold">單字</b>
   - 錯誤修正對照：<b class="text-rose-600 bg-rose-50 px-1 py-0.5 rounded">原錯字</b> ➔ <b class="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">正確用法</b>
3. 請使用層次分明的 HTML 結構（如 <h4>, <p>, <ul>, <li>, <ol>）來展現專業出版物等級的排版。
`;

  if (mode === 'guidance') {
    const scoreMap: Record<string, string> = {
      under10: '10分以下 (基礎打底：著重基本句構、連接詞與核心詞彙)',
      '11to15': '11~15分 (進階提升：著重轉折句型、段落銜接與進階詞彙)',
      '16to20': '16~20分 (高分頂尖：著重精妙破題、進階修辭與頂級詞彙)',
    };
    const targetDescription = scoreMap[targetScore] || scoreMap['11to15'];

    if (subType === '單字片語發想') {
      const prompt = `${visionPromptIntro}${formattingInstruction}你是一位 ETS 官方認證英文寫作專家。請針對主題【${topic || '詳見上傳題目檔案'}】，目標程度為【${targetDescription}】，提供高階寫作素材庫：

===GUIDANCE_VOCAB===
<h4>高分關鍵單字庫 (Core Vocabulary)</h4>
(請提供 6-8 個學測與托福高頻單字，包含英文、KK音標、中文釋義與優良例句。)

<h4>進階道地片語 (Essential Idioms & Phrases)</h4>
(提供 4-5 個進階片語，含中文說明與寫作範例。)

<h4>萬用名言與諺語 (Proverbs & Quotes)</h4>
(提供 3 則經典諺語或金句，並註明如何融入文章。)
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
        console.error('AI Error:', error);
        return { error: '生成失敗，請稍後再試。' };
      }
    } else {
      const prompt = `${visionPromptIntro}${formattingInstruction}你是一位 ETS 官方認證英文寫作專家。請針對【${subType}】題目【${topic || '詳見上傳題目檔案'}】，目標程度【${targetDescription}】，提供寫作架構引導：

===GUIDANCE_THEME===
<h4>核心主題與破題立意 (Thesis & Framing)</h4>
(深入剖析題目細節，給予學術等級的立意方向與破題脈絡)

===GUIDANCE_OUTLINE===
<h4>段落結構與關鍵句型 (Paragraph Outline & Structures)</h4>
(給予 Paragraph 1 與 Paragraph 2 的邏輯脈絡與高分銜接句型)

===GUIDANCE_VOCAB===
<h4>推薦高分詞彙與諺語 (Vocabulary & Expressions)</h4>
(提供符合該分數目標的專業詞彙、片語與萬用金句)
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
        console.error('AI Error:', error);
        return { error: '生成失敗，請稍後再試。' };
      }
    }
  } else {
    // 批改模式
    const prompt = `${visionPromptIntro}${formattingInstruction}你是一位嚴謹的 ETS 官方認證閱卷主考官。請依據台灣大考中心（CEEC）與 ETS 寫作評分規準，對學生文章進行深度分析。

【題目 / 題目卷檔案】：
${topic || '詳見上傳之圖片/PDF 題目卷'}

【學生內文】：
${userEssay}

===SECTION_SUMMARY===
SCORE: [請在此處僅寫數字/20，例如：15/20]
<h4>四大評分指標詳細分析 (Analytical Assessment)</h4>
<ul>
  <li><b>內容 (Content)</b>: [ /5分]</li>
  <li><b>組織 (Organization)</b>: [ /5分]</li>
  <li><b>文法句構 (Grammar & Structures)</b>: [ /5分]</li>
  <li><b>字詞標點 (Vocabulary & Punctuation)</b>: [ /5分]</li>
</ul>
<h4>考官總評與進步建議 (Examiner Feedback)</h4>
(詳細說明優缺點與突破瓶頸的方向)

===SECTION_ERRORS===
<h4>逐句文法與用語修正 (Line-by-Line Diagnostics)</h4>
(請詳細對照列出原句錯誤、修改後語句與語法解說)

===SECTION_MODEL===
<h4>官方標竿示範範文 (Model Response - Band 16+)</h4>
(提供一篇結構嚴謹、用詞精準且修辭優美的模範文章)
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
      
      const scoreLine = rawSummary.match(/SCORE:\s*(\d+\s*\/\s*20)/i);
      if (scoreLine) {
        scoreText = scoreLine[1];
        rawSummary = rawSummary.replace(/SCORE:\s*\d+\s*\/\s*20/i, '').trim();
      }

      return {
        correctionResult: {
          score: scoreText || '15/20',
          summary: rawSummary,
          errors: errorsMatch ? errorsMatch[1].trim() : '',
          modelEssay: modelMatch ? modelMatch[1].trim() : '',
        },
      };
    } catch (error) {
      console.error('AI Error:', error);
      return { error: '生成失敗，請稍後再試。' };
    }
  }
}