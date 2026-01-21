import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
    try {
        const { jpText, enText } = await req.json();

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        const prompt = `
Analyze the following text pair (Japanese intention and best English classification):
JP: "${jpText}"
EN: "${enText}"

Task: Classify into "Category" and "Grammar Pattern".
1. Category: Choose ONE from [Request, Apology, Refusal, Proposal, Question, Impression, Empathy, Plan, Health, Study, Work, Chat, Other].
2. Pattern: Identify the key grammatical pattern used in English. Examples: "Could you", "I want to", "It depends", "How about", "Present Perfect", "Passive", etc. Keep it short (2-3 words).
3. Confidence: 0-100 integer indicating how confident you are in this classification.

Return JSON:
{
  "topic": "CategoryName",
  "pattern": "PatternName",
  "confidence": 80
}
`;
        const startTime = Date.now();
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a linguistic analyzer. Output strict JSON." },
                { role: "user", content: prompt }
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const result = JSON.parse(completion.choices[0].message.content);

        // Analytics
        console.log(JSON.stringify({
            event: 'LLM-Tag-Success',
            duration: Date.now() - startTime,
            model: completion.model
        }));

        return NextResponse.json(result);

    } catch (error) {
        console.error('Tagging error:', error);
        return NextResponse.json({ error: 'Tagging failed' }, { status: 500 });
    }
}
