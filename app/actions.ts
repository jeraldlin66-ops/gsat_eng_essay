'use server';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function generateEssayHelp(
  mode: 'guidance' | 'correction',
  subType: string,
  topic: string,
  userEssay?: string
) {
  const apiKey = process.env.GROQ_API_KEY2 || process.env.GROQ_API_KEY;

  if (!apiKey) {
    return '⚠️ 尚未檢測到 API Key。請先在 .env.local 或 Vercel 設定 GROQ_API_KEY2。';
  }

  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: apiKey,
  });

  let prompt = '';

  if (mode === 'guidance') {
    prompt = `你是一位台灣學測英文作文專家。請針對以下「${subType}」題目/情境提供詳細的寫作引導：

題目/情境描述：${topic}

請提供以下結構化引導內容：
1. 【核心主題與立意建議】：如何破題、立意發想點與寫作切入角度。
2. 【第一段 (Introduction) 關鍵大綱與必備句型】。
3. 【第二段 (Body / Conclusion) 關鍵大綱與必備句型】。
4. 【高分關鍵單字與進階片語】：提供 5-8 個符合學測 4000-7000 字頻的高級詞彙（附中文解釋與精準例句）。`;
  } else {
    prompt = `你是一位嚴謹的台灣大考中心（CEEC）學測英文作文閱卷老師。請嚴格依據「大考中心學測英文作文評分標準」進行全文批改與診斷。

【題目 / 情境】：
${topic}

【學生作文內容】：
${userEssay}

請依據以下四大維度（每項 5 分，總分 20 分）輸出詳細的批改報告：

1. 【大考中心標準預估得分與總評】
   - 內容 (Content) [ /5分]：是否切題、發展是否完整。
   - 組織 (Organization) [ /5分]：起承轉合、段落發展與銜接詞運用。
   - 文法句構 (Grammar & Structures) [ /5分]：句型多樣性與文法正確度。
   - 字詞拼字標點 (Vocabulary, Spelling & Punctuation) [ /5分]：用詞道地度、拼字與標點符號正確性。
   - 預估總分：[ /20分]

2. 【逐句錯字、文法與標點符號修正對照】
   - 列出原句中的「文法錯誤、拼字誤用、標點符號誤用（如逗號拼接句）、不道地表達」。
   - 提供 Corrected Version（修改對照）並說明修改理由。

3. 【高分重寫範文 (Model Essay)】
   - 提供一篇達到 16+ 分等級、符合大考中心偏好結構的高分示範文章。`;
  }

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