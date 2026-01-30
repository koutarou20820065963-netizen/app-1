import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBalance } from '@/lib/server/credit';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = auth();
    const userId = session.userId;

    if (!userId) {
        return NextResponse.json({ balance: 0 }); // Or 401
    }

    const balance = await getBalance(userId);
    return NextResponse.json({ balance });
}
