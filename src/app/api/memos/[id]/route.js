import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function PATCH(req, { params }) {
    const { userId } = auth();
    const ownerId = userId || 'demo-user';
    const { id } = params;

    try {
        const updates = await req.json();

        // Handle nested review updates if sent from client
        // Map client 'review' object to flattened schema if necessary
        // Or just assume updates matches schema?
        // Client sends: { review: { level, interval, nextReviewAt } }
        // Schema: level, interval, nextReviewAt

        const data = { ...updates };
        if (data.review) {
            data.level = data.review.level;
            data.interval = data.review.interval;
            data.nextReviewAt = data.review.nextReviewAt;
            delete data.review;
        }

        const memo = await prisma.memo.update({
            where: { id, userId: ownerId },
            data
        });
        return NextResponse.json(memo);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { userId } = auth();
    const ownerId = userId || 'demo-user';
    const { id } = params;

    try {
        await prisma.memo.delete({
            where: { id, userId: ownerId }
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
