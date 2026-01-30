import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/server/db';

export async function GET() {
    // Return all history for analytics
    return NextResponse.json({ memos: mockStore || [] });
}
