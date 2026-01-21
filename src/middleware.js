import { NextResponse } from 'next/server';

const output = new Map();

// Simple cleanup every hour
setInterval(() => output.clear(), 3600000);

export function middleware(request) {
    // Only limit API routes
    if (!request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    const ip = request.headers.get('x-forwarded-for') || 'ip';
    // const ip = 'global'; // For simple demo if header missing

    // Limit: 50 requests per minute per IP
    // Note: In serverless, this Map is per-instance, so it's loose security.
    // Real security relies on OpenAI Hard Cap.

    const now = Date.now();
    const windowMs = 60 * 1000;
    const limit = 50;

    const record = output.get(ip) || { count: 0, startTime: now };

    // Reset if window passed
    if (now - record.startTime > windowMs) {
        record.count = 1;
        record.startTime = now;
    } else {
        record.count++;
    }

    output.set(ip, record);

    if (record.count > limit) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
