import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { mode, sources } = await req.json();

        // Sources passed from client (fetched from IndexedDB)
        // Check if sources have aiCache
        const candidates = sources ? sources.filter(m => m.aiCache) : [];

        let questions = [];

        if (candidates.length > 0) {
            // Pick random 3 items
            const shuffled = candidates.sort(() => 0.5 - Math.random()).slice(0, 3);

            questions = shuffled.map((memo, idx) => ({
                id: idx + 1,
                memoId: memo.id,
                level: memo.review?.level || 0, // NEW: Pass level
                type: 'translation',
                text: `「${memo.jpText}」を英語で言うと？`,
                hint: 'Remember your memo...',
                answer: memo.aiCache.english || memo.aiCache.best
            }));
        }

        // No fallback. If empty, client handles it.
        return NextResponse.json({ questions });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
