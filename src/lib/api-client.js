// Replaces Client-Side DB with Server API Calls

async function fetchAPI(endpoint, options = {}) {
    const res = await fetch(endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    if (!res.ok) throw new Error('API Error');
    return res.json();
}

export async function addMemo(jpText) {
    return fetchAPI('/api/memos', {
        method: 'POST',
        body: JSON.stringify({ jpText })
    });
}

export async function getMemos(status = 'unprocessed') {
    return fetchAPI(`/api/memos?status=${status}`);
}

export async function updateMemo(id, updates) {
    return fetchAPI(`/api/memos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    });
}

export async function deleteMemo(id) {
    return fetchAPI(`/api/memos/${id}`, {
        method: 'DELETE'
    });
}

// Stub for consistency
export async function initDB() { return null; }
