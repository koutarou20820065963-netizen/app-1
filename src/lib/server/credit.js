import { db } from './db';

// Simple in-memory fallback for demo
const MOCK_BALANCES = {};

export async function getBalance(userId) {
    if (!process.env.DATABASE_URL) {
        if (MOCK_BALANCES[userId] === undefined) MOCK_BALANCES[userId] = 20; // Signup bonus
        return MOCK_BALANCES[userId];
    }

    try {
        // Lazy signup: Check if user exists, if not give 20 credits
        const res = await db.query(`SELECT SUM(delta) as balance FROM credit_ledger WHERE user_id = $1`, [userId]);

        let balance = 0;
        if (res.rows[0].balance === null) {
            // First time? Add signup bonus
            await addTransaction(userId, 20, 'signup_bonus', 'system');
            balance = 20;
        } else {
            balance = parseInt(res.rows[0].balance, 10);
        }
        return balance;
    } catch (e) {
        console.error("DB Error getBalance:", e);
        return 0; // Fallback
    }
}

export async function addTransaction(userId, delta, reason, source, metadata = {}) {
    if (!process.env.DATABASE_URL) {
        if (MOCK_BALANCES[userId] === undefined) MOCK_BALANCES[userId] = 20;
        MOCK_BALANCES[userId] += delta;
        console.log(`[MockCredit] ${userId} delta ${delta} -> ${MOCK_BALANCES[userId]}`);
        return;
    }

    await db.query(
        `INSERT INTO credit_ledger (user_id, delta, reason, source, metadata) VALUES ($1, $2, $3, $4, $5)`,
        [userId, delta, reason, source, metadata]
    );
}

export async function hasCredit(userId, cost) {
    const balance = await getBalance(userId);
    return balance >= cost;
}
