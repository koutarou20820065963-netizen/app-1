import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
    try {
        const { targetEn, userEn, jpContext } = await req.json();

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        const prompt = `
You are an English teacher grading a student's answer.
Context (Japanese): "${jpContext}"
Target Answer (Correct): "${targetEn}"
Student Answer: "${userEn}"

Task: Grade the student's answer based on naturalness and meaning in this context.
Return JSON:
- score: 0 to 100 (100 = perfect/natural, 80 = minor grammar ok, 50 = understandable but unnatural, 0 = wrong).
- bestFix: A single improved version (if student is wrong/unnatural, otherwise existing target).
- reasonJa: A short explanation in Japanese (1-2 sentences). Why is it wrong? Or "Perfect!".

Format:
{
  "score": number,
  "bestFix": "string",
  "reasonJa": "string"
}
`;
        const startTime = Date.now();
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a strict but helpful English teacher. Output strict JSON." },
                { role: "user", content: prompt }
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const result = JSON.parse(completion.choices[0].message.content);

        // Analytics
        console.log(JSON.stringify({
            event: 'LLM-Grade-Success',
            duration: Date.now() - startTime,
            model: completion.model
        }));

        return NextResponse.json(result);

    } catch (error) {
        console.error('Grading error:', error);
        return NextResponse.json({ error: 'Grading failed' }, { status: 500 });
    }
}
