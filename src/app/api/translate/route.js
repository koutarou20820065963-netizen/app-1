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
Role: You are an expert Native English Coach finding the best way to say the user's Japanese phrase in natural, modern usage.

Input: "${jpText}"

Tasks:
1. Translate to natural, speaking-style English.
2. Provide a 1-line analysis in Japanese focusing on NUANCE/FEELING (Why is this natural? Is it casual/formal?). 
   - DO NOT give dictionary definitions.
   - DO NOT explain the obvious (e.g. "This is a verb").
   - DO explain cultural context or native intuition.
3. Suggest better/alternative phrases.
4. Warn about misuse/tone.

Return strict JSON:
{
  "english": "Natural English translation",
  "analysis": {
    "points": ["Unique insight about tone/nuance (Bold English keywords). Example: '**Wanna** implies you are friends.'"],
    "improvedPhrases": [ { "en": "Alternative (Native)", "ja": "Situation/Nuance difference" } ],
    "cautions": ["Tone warning or common mistake (Optional)"]
  },
  "pronounceText": "English for TTS"
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
