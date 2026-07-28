'use server';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateEssayHelp(topic: string, type: string) {
  if (!process.env.GROQ_API_KEY) {
    return '⚠️ 請先設定 GROQ_API_KEY 環境變數。';
  }

  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `你是一位台灣學測英文作文專家。請針對以下題目/情境提供寫作建議：
題型：${type}
題目內容：${topic}

請提供：
1. 【核心主題與立意建議】
2. 【第一段 (Introduction) 關鍵大綱與句型】
3. 【第二段 (Body/Conclusion) 關鍵大綱與句型】
4. 【5個高分關鍵單字/片語 (附中文與例句)】`,
    });

    return text;
  } catch (error) {
    console.error('AI Generation Error:', error);
    return '生成失敗，請稍後再試或檢查 API Key 是否正確。';
  }
}