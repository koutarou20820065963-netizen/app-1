import prisma from '@/lib/prisma';

export const db = prisma;

export async function getMemos(status = 'unprocessed') {
    return prisma.memo.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' }
    });
}

export async function updateMemo(id, updates) {
    return prisma.memo.update({
        where: { id },
        data: updates
    });
}

// Ensure mockStore is gone or aliased to empty if legacy code uses it
export const mockStore = [];
