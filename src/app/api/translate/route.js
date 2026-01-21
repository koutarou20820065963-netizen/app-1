import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
    try {
        const { jpText } = await req.json();

        if (!jpText || typeof jpText !== 'string') {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                error: 'API Key missing',
                best: '設定が必要です',
                alts: ['APIキーが設定されていません'],
                notes: '管理者に連絡してください',
                example: 'Contact admin.',
                pronounceText: 'Error'
            }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        const prompt = `
You are a helpful English teacher for Japanese speakers.
The user wants to express the following Japanese concept in English:
Translate to natural, speaking-style English: "${jpText}"

Requirements:
1. "best": The most natural, common expression for casual conversation.
2. "alts": Exactly 2 alternative expressions (formal or slang).
3. "notesJa": meaningful explanation in JAPANESE (2-3 lines). Explain *why* this English is natural, or grammar points (e.g. "現在完了形", "助動詞").
4. "exampleEn": A short example sentence using the "best" expression.
5. "exampleJa": Japanese translation of the example.
6. "pronounceText": Text for TTS (usually same as "best").

Return strict JSON:
{
  "best": "string",
  "alts": ["string", "string"],
  "notesJa": "string",
  "exampleEn": "string",
  "exampleJa": "string",
  "pronounceText": "string"
}
`;
        const startTime = Date.now();
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful translator. Output JSON only." },
                { role: "user", content: prompt }
            ],
            // Use user-provided prompt logic
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            temperature: 0.3,
        });
        const duration = Date.now() - startTime;

        const content = completion.choices[0].message.content;
        let result = JSON.parse(content);

        // Analytics
        console.log(JSON.stringify({
            event: 'LLM-Success',
            status: 200,
            duration,
            model: completion.model,
            jpTextLength: jpText.length
        }));

        // Add metadata
        result.model = completion.model;
        result.generatedAt = new Date().toISOString();

        return NextResponse.json(result);

    } catch (error) {
        console.error('Translation error:', error);

        // Analytics Error
        console.log(JSON.stringify({
            event: 'LLM-Error',
            status: 500,
            error: error.message
        }));

        return NextResponse.json({
            error: 'Generation failed',
            best: '変換に失敗しました',
            alts: ['再試行してください'],
            notes: 'エラーが発生しました。通信環境を確認してください。',
            example: 'Error occurred.',
            exampleJa: 'エラーが発生しました。',
            pronounceText: 'Error'
        }, { status: 500 });
    }
}
