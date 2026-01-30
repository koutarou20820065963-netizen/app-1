import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
    try {
        const { question, userAnswer, correctAnswer, memoId, currentLevel = 0 } = await req.json();

        // 1. Grading (Mock or OpenAI)
        const apiKey = process.env.OPENAI_API_KEY;
        let result;

        if (!apiKey || process.env.MOCK_AI === '1') {
            await new Promise(r => setTimeout(r, 800));
            // Simple mock grading logic
            const score = userAnswer.toLowerCase().trim() === correctAnswer?.toLowerCase().trim() ? 100 :
                (userAnswer.length > 3 ? 60 : 20);

            result = {
                score,
                reasonJa: score >= 80 ? "正解です！よく覚えていますね。" : "惜しいです。もう一度確認しましょう。",
                bestFix: correctAnswer
            };
        } else {
            const openai = new OpenAI({ apiKey });
            const prompt = `
Question: "${question}"
User Answer: "${userAnswer}"
Correct Answer: "${correctAnswer}"

Grade the user's answer (0-100).
Explain why in Japanese.
Provide a better native phrasing if needed.

Return JSON:
{
  "score": number,
  "reasonJa": "string",
  "bestFix": "string"
}
`;
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o-mini",
                response_format: { type: "json_object" }
            });
            result = JSON.parse(completion.choices[0].message.content);
        }

        // 2. SRS Logic (Spaced Repetition)
        // Levels: 0 (New) -> 1 (1d) -> 2 (3d) -> 3 (7d) -> 4 (14d) -> 5 (30d) -> Done
        const intervals = [0, 1, 3, 7, 14, 30];
        let nextLevel = currentLevel;
        let nextInterval = 0;
        let markAsDone = false;

        if (result.score >= 80) {
            nextLevel = currentLevel + 1;
            if (nextLevel >= intervals.length) {
                markAsDone = true; // Graduate
            } else {
                nextInterval = intervals[nextLevel];
            }
        } else if (result.score < 50) {
            // Regress
            nextLevel = Math.max(0, currentLevel - 1);
            nextInterval = 1; // Review tomorrow
        } else {
            // Keep same
            nextInterval = 1;
        }

        const now = new Date();
        const nextReviewDate = new Date();
        nextReviewDate.setDate(now.getDate() + nextInterval);

        result.srs = {
            level: nextLevel,
            interval: nextInterval,
            nextReviewAt: nextReviewDate.toISOString(),
            markAsDone
        };

        return NextResponse.json(result);

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
