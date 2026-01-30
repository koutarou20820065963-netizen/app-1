import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes
const isPublicRoute = createRouteMatcher([
    '/',
    '/test(.*)',
    '/queue(.*)',
    '/insights(.*)',
    '/archive(.*)',
    '/memo(.*)',
    // '/api/translate(.*)', // Removed to enforce Auth
    '/api/test(.*)',
    // '/api/grade(.*)', // Removed to enforce Auth
    '/sign-in(.*)',
    '/sign-up(.*)'
]);

const rateLimits = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 50;

setInterval(() => rateLimits.clear(), 3600000);

function checkRateLimit(req) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const record = rateLimits.get(ip) || { count: 0, startTime: now };

    if (now - record.startTime > WINDOW_MS) {
        record.count = 1;
        record.startTime = now;
    } else {
        record.count++;
    }

    rateLimits.set(ip, record);
    return record.count <= MAX_REQUESTS;
}

export default clerkMiddleware((auth, req) => {
    // 1. Rate Limiting for API
    if (req.nextUrl.pathname.startsWith('/api')) {
        if (!checkRateLimit(req)) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }
    }

    // 2. Auth Protection
    if (!isPublicRoute(req)) {
        const { userId } = auth();
        if (!userId) {
            // Protect API routes with JSON 401
            if (req.nextUrl.pathname.startsWith('/api')) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            // Protect Pages with Redirect
            return auth().redirectToSignIn({ returnBackUrl: req.url });
        }
    }
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
