import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@clerk/nextjs/server';
import { addTransaction, getBalance, hasCredit } from '@/lib/server/credit';
import { checkRateLimit } from '@/lib/server/ratelimit';

export async function POST(req) {
    let userId = null;
    let deducted = false;

    try {
        const { jpText } = await req.json();

        if (!jpText || typeof jpText !== 'string') {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const session = auth();
        userId = session.userId;

        // Check limits if logged in
        if (userId) {
            const limitCheck = await checkRateLimit(userId);
            if (!limitCheck.allowed) {
                return NextResponse.json({ error: limitCheck.reason }, { status: 429 });
            }
            if (process.env.OPENAI_API_KEY) {
                // Credit check
                // For now, if mock mode, skip credit deduction to avoid database errors if table missing
                // but typically we want it. User prioritized stability.
                try {
                    const canProceed = await hasCredit(userId, 1);
                    if (!canProceed) {
                        return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
                    }
                    await addTransaction(userId, -1, 'translate', 'api');
                    deducted = true;
                } catch (e) {
                    console.warn("Credit check failed (ignoring for dev stability):", e);
                }
            }
        }

        const apiKey = process.env.OPENAI_API_KEY;
        let result;

        // MOCK LOGIC
        if (!apiKey || process.env.MOCK_AI === '1') {
            await new Promise(r => setTimeout(r, 800));
            console.log("Using Mock Response");
            result = {
                english: `[Mock] ${jpText} (Translated)`,
                analysis: {
                    points: [
                        "主語の **Slightly** を文頭に置くことで、ニュアンスを和らげています。",
                        "**Make progress** は「進捗を出す」という自然なコロケーションです。"
                    ],
                    improvedPhrases: [
                        { en: `[Mock] Natural: ${jpText}`, ja: "より口語的な表現です" },
                        { en: `[Mock] Formal: ${jpText}`, ja: "ビジネスメールで使えます" }
                    ],
                    cautions: [
                        "この表現は **Casual** なので、上司には適しません。",
                        "**Gonna** は書き言葉では使いません。"
                    ]
                },
                pronounceText: `[Mock] ${jpText}`,
                credits: userId ? await getBalance(userId) : 999
            };
            return NextResponse.json(result);
        }

        // REAL LOGIC
        const openai = new OpenAI({ apiKey });
        const prompt = `
You are a helpful English teacher for Japanese speakers.
The user wants to express: "${jpText}"

Task:
1. Translate to natural, speaking-style English ("english").
2. Analyze the translation mainly in JAPANESE ("analysis").

analysis requirements:
- "points": [Array of strings] 
   - Explain in JAPANESE. 
   - When referring to specific English words/grammar, use bold formatting like **word**.
   - Do NOT add English translations in brackets for the whole sentence.
   - Example: "**Have been** を使うことで、過去から現在までの継続を表しています。"
- "improvedPhrases": [Array of objects {en, ja}] 
   - Alternative natural expressions.
- "cautions": [Array of strings] 
   - Explain nuances or warnings in JAPANESE.
   - Example: "**Wanna** は非常にくだけた表現なので、親しい間柄でのみ使います。"

Return strict JSON:
{
  "english": "string",
  "analysis": {
    "points": ["string"],
    "improvedPhrases": [ { "en": "string", "ja": "string" } ],
    "cautions": ["string"]
  },
  "pronounceText": "string"
}
`;
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful translator. Output JSON only." },
                { role: "user", content: prompt }
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        result = JSON.parse(completion.choices[0].message.content);

        if (userId) {
            try { result.credits = await getBalance(userId); } catch (e) { }
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Translation error:', error);

        if (userId && deducted) {
            try { await addTransaction(userId, 1, 'refund', 'system', { error: error.message }); } catch (e) { }
        }

        return NextResponse.json({
            error: 'Generation failed',
            detail: error.message
        }, { status: 500 });
    }
}
