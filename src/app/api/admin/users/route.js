import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
    const { userId } = auth();
    // In real app, check if userId is admin in DB
    // const user = await prisma.user.findUnique({ where: { id: userId } });
    // if (user.role !== 'admin') return Forbidden;

    // MVP: Allow list
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(users);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
