'use server';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function generateEssayHelp(
  mode: 'guidance' | 'correction',
  subType: string,
  targetScore: string, // 僅 guidance 模式使用
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

  if (mode === 'guidance') {
    const scoreMap: Record<string, string> = {
      under10: '10分以下 (基礎打底：通順基本句構、基本連接詞與核心詞彙)',
      '11to15': '11~15分 (進階提升：轉折連接詞、複合句型與進階詞彙)',
      '16to20': '16~20分 (高分頂尖：精妙破題、倒裝/分詞修辭與頂級詞彙)',
    };
    const targetDescription = scoreMap[targetScore] || scoreMap['11to15'];

    // 單字片語發想模式：不提供段落大綱，專注於詞彙、片語、諺語
    if (subType === '單字片語發想') {
      const prompt = `你是一位台灣學測英文作文專家。請針對主題【${topic}】，目標設定為【${targetDescription}】，提供豐富的寫作素材補給包：

請務必嚴格按照以下標籤格式輸出：

===GUIDANCE_VOCAB===
(請提供以下內容：
1. 【高分核心單字】：5-8 個符合學測高頻高級單字，附中文解釋、KK音標與優良例句。
2. 【進階必備片語】：5 個精準道地的英文片語，附中文解釋與寫作例句。
3. 【萬用金句與俗諺 (Proverbs)】：3-5 則與該主題相關的名言佳句或諺語，並說明如何運用於學測作文中。)
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
        console.error('AI Generation Error:', error);
        return { error: '生成失敗，請確認 API Key 是否正確。' };
      }
    } else {
      // 一般引導模式：結構化分為主題立意、段落大綱、單字片語
      const prompt = `你是一位台灣學測英文作文專家。請針對【${subType}】題目/情境，目標設定為【${targetDescription}】，提供客製化的寫作指導：

題目/情境描述：${topic}

請務必嚴格按照以下三大標籤格式輸出內容（不要改動標籤名稱）：

===GUIDANCE_THEME===
(在這裡填寫【核心主題與破題立意建議】：如何破題、立意切入點與發想方向)

===GUIDANCE_OUTLINE===
(在這裡填寫【第一段與第二段段落大綱與必備句型】：
1. 第一段 (Introduction) 大綱與萬用句型
2. 第二段 (Body / Conclusion) 大綱與萬用句型)

===GUIDANCE_VOCAB===
(在這裡填寫【高分單字、片語與俗諺】：
1. 5 個高分單字（含中文、例句）
2. 3 個進階片語
3. 1-2 則適合此題目的萬用俗諺/名言)
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
        console.error('AI Generation Error:', error);
        return { error: '生成失敗，請確認 API Key 是否正確。' };
      }
    }
  } else {
    // 批改模式：無需設定分數區間，直接給出大字體得分與三大評分色框
    const prompt = `你是一位嚴謹的台灣大考中心（CEEC）學測英文作文閱卷老師。請依據「大考中心學測英文作文評分標準」對學生的作文進行深度批改。

【題目 / 情境】：
${topic}

【學生作文內容】：
${userEssay}

請務必嚴格按照以下三大標籤格式輸出內容（不要改動標籤名稱）：

===SECTION_SUMMARY===
SCORE: [請在這裡只寫數字/20，例如：14/20]
(在這裡填寫【總評與四大維度評分】：
- 內容 (Content) [ /5分]
- 組織 (Organization) [ /5分]
- 文法句構 (Grammar & Structures) [ /5分]
- 字詞拼字標點 (Vocabulary, Spelling & Punctuation) [ /5分]
- 整體優缺點分析與給學生的建議)

===SECTION_ERRORS===
(在這裡填寫【文法、用語與標點符號修正】：
- 列出原句中的文法錯誤、拼字誤用、標點符號誤用、不道地表達
- 提供 Corrected Version（修改對照）並說明修改理由)

===SECTION_MODEL===
(在這裡填寫【高分示範範文 Model Essay】：
提供一篇結構完整、用語精確且符合 16+ 分標準的高分示範文章)
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
      
      // 擷取 SCORE: 行
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
      console.error('AI Generation Error:', error);
      return { error: '生成失敗，請確認 API Key 是否正確。' };
    }
  }
}