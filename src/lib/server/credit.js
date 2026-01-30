import prisma from '@/lib/prisma';

export async function getBalance(userId) {
    if (!prisma) return 999;

    try {
        // Find or create user
        let user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            // Lazy create
            user = await prisma.user.create({
                data: {
                    id: userId,
                    email: `user_${userId}@example.com`, // Placeholder, Clerk syncs normally
                    credits: 30 // Default signup bonus
                }
            });
            // Log signup bonus
            await prisma.creditLog.create({
                data: {
                    userId,
                    action: 'signup_bonus',
                    amount: 30
                }
            });
        }
        return user.credits;
    } catch (e) {
        console.error("DB Error getBalance:", e);
        return 0;
    }
}

export async function addTransaction(userId, delta, reason, source, metadata = {}) {
    if (!prisma) return;

    try {
        // Transaction: Update User and Create Log
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: delta } }
            }),
            prisma.creditLog.create({
                data: {
                    userId,
                    action: reason, // Map 'reason' to 'action'
                    amount: delta
                    // metadata not supported in current schema, ignore
                }
            })
        ]);
    } catch (e) {
        console.error("Transaction failed:", e);
        throw e; // Propagate error for API to handle
    }
}

export async function hasCredit(userId, cost) {
    // If no cost, allowed
    if (cost <= 0) return true;

    // Check balance
    const balance = await getBalance(userId);
    return balance >= cost;
}
