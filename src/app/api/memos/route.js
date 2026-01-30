import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
    const { userId } = auth();
    // For MVP/Demo: if no auth, use 'demo-user'
    const ownerId = userId || 'demo-user';

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    try {
        const where = { userId: ownerId };
        if (status) where.status = status;

        const memos = await prisma.memo.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(memos);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    const { userId } = auth();
    const ownerId = userId || 'demo-user';

    try {
        const { jpText } = await req.json();

        const memo = await prisma.memo.create({
            data: {
                userId: ownerId,
                jpText,
                status: 'unprocessed',
                // Flattened fields use defaults (level: 0, interval: 0)
            }
        });
        return NextResponse.json(memo);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
