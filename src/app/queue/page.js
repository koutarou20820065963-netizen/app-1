'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, ArrowUp, ArrowDown, Tag, MapPin, Clock } from 'lucide-react';
import { getMemos, updateMemo } from '../../lib/db';
import MemoList from '../../components/MemoList';
import styles from './page.module.css';

export default function QueuePage() {
    const [memos, setMemos] = useState([]);
    const [filtered, setFiltered] = useState([]);

    // Filters
    const [tab, setTab] = useState('unprocessed'); // 'unprocessed', 'review', 'done'
    const [search, setSearch] = useState('');
    const [sortMode, setSortMode] = useState('newest'); // newest, oldest, review

    useEffect(() => {
        loadMemos();
    }, [tab]);

    const loadMemos = async () => {
        // Build custom fetcher if needed, but getMemos gets by simple status
        // For 'review', it's technically 'unprocessed' BUT nextReviewAt < now
        // For 'done', it's 'done'
        const statusToFetch = tab === 'review' ? 'unprocessed' : tab;
        const data = await getMemos(statusToFetch);
        setMemos(data);
    };

    // Apply Logic
    useEffect(() => {
        let res = [...memos];

        // 1. SRS Filter for "Review" Tab
        if (tab === 'review') {
            const now = new Date().toISOString();
            res = res.filter(m => m.review && m.review.nextReviewAt <= now);
        }

        // 2. Search
        if (search) {
            const low = search.toLowerCase();
            res = res.filter(m =>
                m.jpText.toLowerCase().includes(low) ||
                (m.aiCache?.english && m.aiCache.english.toLowerCase().includes(low))
            );
        }

        // 3. Sort
        res.sort((a, b) => {
            if (sortMode === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortMode === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortMode === 'review') { // Priority
                return new Date(a.review?.nextReviewAt || '9999-01-01') - new Date(b.review?.nextReviewAt || '9999-01-01');
            }
            return 0;
        });

        // 4. Pin Priority (Always top)
        res.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

        setFiltered(res);
    }, [memos, search, sortMode, tab]);

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <h1>未処理・復習</h1>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === 'unprocessed' ? styles.activeTab : ''}`}
                        onClick={() => setTab('unprocessed')}
                    >All</button>
                    <button
                        className={`${styles.tab} ${tab === 'review' ? styles.activeTab : ''}`}
                        onClick={() => setTab('review')}
                    >Review</button>
                    <button
                        className={`${styles.tab} ${tab === 'done' ? styles.activeTab : ''}`}
                        onClick={() => setTab('done')}
                    >Done</button>
                </div>
            </header>

            {/* Controls */}
            <div className={styles.controls}>
                <div className={styles.searchBox}>
                    <Search size={16} className={styles.icon} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search..."
                    />
                </div>
                <div className={styles.sortBox}>
                    <select value={sortMode} onChange={e => setSortMode(e.target.value)}>
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="review">Due Date</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className={styles.listArea}>
                <MemoList
                    memos={filtered}
                    onRefresh={loadMemos}
                    emptyMessage={tab === 'review' ? "今日の復習はありません！" : "メモはありません。"}
                />
            </div>
        </div>
    );
}
