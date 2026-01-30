import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
    // Auth check omitted for MVP Demo
    try {
        const { userId, amount } = await req.json();

        // Update User
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { increment: amount }
            }
        });

        // Log
        await prisma.creditLog.create({
            data: {
                userId,
                action: 'admin_adjust',
                amount
            }
        });

        return NextResponse.json(user);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
