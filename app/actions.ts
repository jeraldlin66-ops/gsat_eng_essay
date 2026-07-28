'use server';
console.log("GROQ KEY Loaded:", process.env.GROQ_API_KEY2 ? "YES" : "NO");
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY2,
});

export async function generateEssayHelp(topic: string, type: string) {
  if (!process.env.GROQ_API_KEY2) {
    return '⚠️ 尚未檢測到 GROQ_API_KEY2。請先在 .env.local 或 Vercel 設定環境變數。';
  }

  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `你是一位台灣學測英文作文專家。請針對以下題目/情境提供詳細的寫作指導建議：

題型：${type}
題目/情境描述：${topic}

請依據台灣學測英文作文評分標準（內容、組織、文法句構、字詞），提供以下內容：
1. 【核心主題與立意建議】（如何破題、立意點與發想方向）
2. 【第一段 (Introduction) 關鍵大綱與必備句型】
3. 【第二段 (Body / Conclusion) 關鍵大綱與必備句型】
4. 【5 個高分關鍵單字 / 高級片語】（請附上中文解釋與極佳範例例句）`,
    });

    return text;
  } catch (error) {
    console.error('AI Generation Error:', error);
    return '生成失敗，請確認 API Key 是否正確或稍後再試。';
  }
}