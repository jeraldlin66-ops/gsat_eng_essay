'use server';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function generateEssayHelp(topic: string, type: string, userEssay?: string) {
  const apiKey = process.env.GROQ_API_KEY2 || process.env.GROQ_API_KEY;

  if (!apiKey) {
    return '⚠️ 尚未檢測到 API Key。請先在 .env.local 或 Vercel 設定 GROQ_API_KEY2。';
  }

  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: apiKey,
  });

  // 判斷是否為「作文批改」模式
  const isCorrection = type === '作文批改';

  const prompt = isCorrection
    ? `你是一位嚴謹的台灣學測英文作文閱卷老師。請針對以下題目與學生撰寫的作文進行深度批改：

【題目 / 情境】：
${topic}

【學生文章內容】：
${userEssay}

請依據台灣學測英文作文評分標準（內容 5 分、組織 5 分、文法句構 5 分、字詞拼字 5 分，總分 20 分），提供以下結構化評語：
1. 【預估得分與整體總評】：給出預估總分（/20），並總結文章亮點與主要問題。
2. 【文法與用字修正建議】：列出文章中的文法錯誤、拼字錯誤或不道地的表達，並提供 Corrected Version（修改對照）。
3. 【結構與內容優化建議】：針對段落銜接、邏輯發展提出具體改進點。
4. 【高分重寫範文】：提供一篇符合 16+ 分標準的高分示範文章。`
    : `你是一位台灣學測英文作文專家。請針對以下題目/情境提供寫作指導建議：

題型：${type}
題目/情境描述：${topic}

請依據台灣學測英文作文評分標準（內容、組織、文法句構、字詞），提供以下內容：
1. 【核心主題與立意建議】（如何破題、立意點與發想方向）
2. 【第一段 (Introduction) 關鍵大綱與必備句型】
3. 【第二段 (Body / Conclusion) 關鍵大綱與必備句型】
4. 【5 個高分關鍵單字 / 高級片語】（請附上中文解釋與極佳範例例句）`;

  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: prompt,
    });

    return text;
  } catch (error) {
    console.error('AI Generation Error:', error);
    return '生成失敗，請確認 API Key 是否正確或稍後再試。';
  }
}