
// Use global to persist across hot reloads in dev
global.mockMemos = global.mockMemos || [];

export const getMemos = async (status) => {
    // Return copy to avoid mutation
    const all = global.mockMemos;
    if (status === 'processed') return all.filter(m => m.aiCache);
    if (status === 'unprocessed') return all.filter(m => !m.aiCache);
    return all;
};

export const updateMemo = async (id, data) => {
    const idx = global.mockMemos.findIndex(m => m.id === id);
    if (idx !== -1) {
        global.mockMemos[idx] = { ...global.mockMemos[idx], ...data };
        return global.mockMemos[idx];
    }
    // If not found (shouldn't happen with correct flow), ignore
    return null;
};

// Add helper to create for testing (called by save)
export const createMemo = async (text) => {
    const newMemo = {
        id: Date.now().toString(),
        jpText: text,
        createdAt: new Date().toISOString(),
        aiCache: null // initially null
    };
    global.mockMemos.unshift(newMemo);
    return newMemo;
};
