import { openDB } from 'idb';

const DB_NAME = 'memo-app-db';
const DB_VERSION = 1;

export async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('memos')) {
                const store = db.createObjectStore('memos', { keyPath: 'id' });
                store.createIndex('updatedAt', 'updatedAt');
            }
        },
    });
}

export async function addMemo(jpText) {
    const db = await initDB();
    const now = new Date().toISOString();
    const memo = {
        id: crypto.randomUUID(),
        jpText,
        status: 'unprocessed',
        createdAt: now,
        updatedAt: now,
        aiCache: null,
        tags: null,   // { topic, pattern }
        review: null, // { attempts: [], nextReviewAt, level }
    };
    await db.add('memos', memo);
    return memo;
}

export async function getMemos(status = 'unprocessed') {
    const db = await initDB();
    const allMemos = await db.getAll('memos');
    return allMemos
        .filter((m) => m.status === status)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Get all memos for analytics
export async function getAllMemos() {
    const db = await initDB();
    const allMemos = await db.getAll('memos');
    return allMemos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getMemo(id) {
    const db = await initDB();
    return db.get('memos', id);
}

export async function updateMemo(id, updates) {
    const db = await initDB();
    const tx = db.transaction('memos', 'readwrite');
    const store = tx.objectStore('memos');

    const memo = await store.get(id);
    if (!memo) throw new Error('Memo not found');

    const updatedMemo = {
        ...memo,
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    await store.put(updatedMemo);
    await tx.done;
    return updatedMemo;
}

export async function deleteMemo(id) {
    const db = await initDB();
    await db.delete('memos', id);
}
