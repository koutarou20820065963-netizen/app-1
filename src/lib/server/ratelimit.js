import { db } from './db';

// Simple in-memory rate limit for short-term spam (serverless compliant-ish)
// Note: In Vercel, this might reset often, but better than nothing.
const SHORT_TERM_LIMIT = new Map();

export async function checkRateLimit(userId) {
    const now = Date.now();

    // 1. Short-term (5 req / 1 min)
    const shortTerm = SHORT_TERM_LIMIT.get(userId) || { count: 0, start: now };
    if (now - shortTerm.start > 60000) {
        shortTerm.count = 1;
        shortTerm.start = now;
    } else {
        shortTerm.count++;
    }
    SHORT_TERM_LIMIT.set(userId, shortTerm);

    if (shortTerm.count > 10) { // Relaxed a bit for dev
        return { allowed: false, reason: "Too many requests. Please wait." };
    }

    // 2. Daily Limit (e.g. 50 generations / day)
    // We count rows in credit_ledger with reason 'translate' or 'grade' for today.
    // Assuming `created_at` exists or we use current date in logic.
    // For now, let's use a simple query if DB available.
    if (!process.env.DATABASE_URL) return { allowed: true };

    try {
        const res = await db.query(
            `SELECT COUNT(*) FROM credit_ledger 
             WHERE user_id = $1 AND reason IN ('translate', 'grade') 
             AND created_at > CURRENT_DATE`,
            [userId]
        );
        const dailyCount = parseInt(res.rows[0].count, 10);
        if (dailyCount >= 50) {
            return { allowed: false, reason: "Daily limit reached (50/50)." };
        }
    } catch (e) {
        console.error("Rate limit check failed", e);
        // Fail open if DB error? Or closed. Open for user exp.
    }

    return { allowed: true };
}
