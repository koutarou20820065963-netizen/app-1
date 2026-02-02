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

        // Personal Use: Skip all credit/rate limit checks
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
Translate "${jpText}" to natural English.
Analyze in Japanese.

Return JSON:
{
  "english": "Natural English translation",
  "analysis": {
    "points": ["Short Japanese explanation of key points (bold English words)"],
    "improvedPhrases": [ { "en": "Alternative", "ja": "Nuance" } ],
    "cautions": ["Japanese warnings (optional)"]
  },
  "pronounceText": "English text for speech"
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


        return NextResponse.json({
            error: 'Generation failed',
            detail: error.message
        }, { status: 500 });
    }
}
