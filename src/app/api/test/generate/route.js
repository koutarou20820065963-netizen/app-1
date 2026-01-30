import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
    const { userId } = auth();
    const ownerId = userId || 'demo-user';

    try {
        const { mode } = await req.json(); // mode: 'review' or 'new'

        // Fetch candidates (unprocessed or due for review)
        // For simple logic: fetch ALL unprocessed, plus DONE/Review items that are due
        const now = new Date();
        const candidates = await prisma.memo.findMany({
            where: {
                userId: ownerId,
                OR: [
                    { status: 'unprocessed' },
                    {
                        status: 'done',
                        nextReviewAt: { lte: now }
                    }
                ]
            }
        });

        let questions = [];

        if (candidates.length > 0) {
            // Pick random 3 items
            const shuffled = candidates.sort(() => 0.5 - Math.random()).slice(0, 3);

            questions = shuffled.map((memo, idx) => ({
                id: idx + 1,
                memoId: memo.id,
                level: memo.level,
                type: 'translation',
                text: `「${memo.jpText}」を英語で言うと？`,
                hint: 'Remember your memo...',
                answer: memo.enText || "Translation not found" // Fallback if no translation cached
            }));
        }

        return NextResponse.json({ questions });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
