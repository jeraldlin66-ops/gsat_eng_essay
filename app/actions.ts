'use server';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function generateEssayHelp(
  mode: 'guidance' | 'correction',
  subType: string,
  targetScore: string, // 'under10' | '11to15' | '16to20'
  topic: string,
  userEssay?: string
) {
  const apiKey = process.env.GROQ_API_KEY2 || process.env.GROQ_API_KEY;

  if (!apiKey) {
    return { error: '⚠️ 尚未檢測到 API Key。請先在 .env.local 或 Vercel 設定 GROQ_API_KEY2。' };
  }

  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: apiKey,
  });

  const scoreMap: Record<string, string> = {
    under10: '10分以下 (基礎打底：注重通順基本句構、基本連接詞與核心詞彙，避免重大語法錯誤)',
    '11to15': '11~15分 (進階提升：注重轉折連接詞、複合句型、段落邏輯銜接與進階詞彙)',
    '16to20': '16~20分 (高分頂尖：注重精妙破題、倒裝/分詞修辭、高級詞彙與深層邏輯發想)',
  };

  const targetDescription = scoreMap[targetScore] || scoreMap['11to15'];

  if (mode === 'guidance') {
    const prompt = `你是一位台灣學測英文作文專家。請針對【${subType}】題目/情境，並目標設定為【${targetDescription}】，提供客製化的寫作指導：

題目/情境描述：${topic}

請依據學生的目標分數區間，提供以下內容：
1. 【核心主題與破題建議】：針對此分數層級適合的切入點與思考方向。
2. 【第一段 (Introduction) 關鍵大綱與適合句型】：提供適合該目標分數的萬用句型與架構。
3. 【第二段 (Body / Conclusion) 關鍵大綱與適合句型】：提供適合該目標分數的延伸句型與段落發展。
4. 【高分關鍵單字與片語】：提供 5-8 個符合該目標層級的高頻高級詞彙（附中文解釋與例句）。`;

    try {
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: prompt,
      });
      return { text };
    } catch (error) {
      console.error('AI Generation Error:', error);
      return { error: '生成失敗，請確認 API Key 是否正確或稍後再試。' };
    }
  } else {
    // 批改模式：請 AI 依照特定標記輸出，方便前端呈現紅框、綠框、深綠框
    const prompt = `你是一位嚴謹的台灣大考中心（CEEC）學測英文作文閱卷老師。請依據「大考中心學測英文作文評分標準」對學生的作文進行批改。
學生的目標/目前程度設定為：【${targetDescription}】

【題目 / 情境】：
${topic}

【學生作文內容】：
${userEssay}

請務必嚴格按照以下三大標籤格式輸出內容（不要改動標籤名稱）：

===SECTION_SUMMARY===
(在這裡填寫【總評與四大維度評分】：
- 內容 (Content) [ /5分]
- 組織 (Organization) [ /5分]
- 文法句構 (Grammar & Structures) [ /5分]
- 字詞拼字標點 (Vocabulary, Spelling & Punctuation) [ /5分]
- 預估總分：[ /20分]
- 整體優缺點分析與給學生的建議)

===SECTION_ERRORS===
(在這裡填寫【文法、用語與標點符號修正】：
- 列出原句中的文法錯誤、拼字誤用、標點符號誤用（如逗號拼接句）、不道地表達
- 提供 Corrected Version（修改對照）並說明修改理由)

===SECTION_MODEL===
(在這裡填寫【適合該目標分數層級的示範範文 Model Essay】：
提供一篇結構完整、用語精確且符合該目標分數區間（${targetDescription}）的高分示範文章)
`;

    try {
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: prompt,
      });

      // 解析三個區塊
      const summaryMatch = text.match(/===SECTION_SUMMARY===([\s\S]*?)(?====SECTION_ERRORS===|$)/);
      const errorsMatch = text.match(/===SECTION_ERRORS===([\s\S]*?)(?====SECTION_MODEL===|$)/);
      const modelMatch = text.match(/===SECTION_MODEL===([\s\S]*?)$/);

      return {
        correctionResult: {
          summary: summaryMatch ? summaryMatch[1].trim() : text,
          errors: errorsMatch ? errorsMatch[1].trim() : '',
          modelEssay: modelMatch ? modelMatch[1].trim() : '',
        },
      };
    } catch (error) {
      console.error('AI Generation Error:', error);
      return { error: '生成失敗，請確認 API Key 是否正確或稍後再試。' };
    }
  }
}