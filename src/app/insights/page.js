'use client';

import { useState, useEffect } from 'react';
import { getMemos } from '@/lib/db';
import styles from './page.module.css';
import { PieChart, List, Sparkles, Clock } from 'lucide-react';

export default function InsightsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        calculateInsights();
    }, []);

    const cleanText = (text) => {
        if (!text) return '';
        return text.replace(/\*\*/g, '').trim();
    };

    const calculateInsights = async () => {
        try {
            // Fetch 'done' memos for history
            const memos = await getMemos('done');

            // 1. Analyze Patterns (Simple Start-of-sentence N-gram)
            const patterns = {};
            const vocab = {};

            memos.forEach(m => {
                if (m.aiCache && m.aiCache.english) {
                    const en = cleanText(m.aiCache.english);
                    // Get first 2-3 words for sentence patterns
                    const words = en.split(' ');
                    if (words.length >= 2) {
                        const pattern2 = words.slice(0, 2).join(' ').toLowerCase();
                        patterns[pattern2] = (patterns[pattern2] || 0) + 1;
                    }
                    if (words.length >= 3) {
                        const pattern3 = words.slice(0, 3).join(' ').toLowerCase();
                        patterns[pattern3] = (patterns[pattern3] || 0) + 1;
                    }
                }
            });

            // Filter significant patterns (appear more than once or just top ones)
            // For MVP, just show top sorted
            const sortedPatterns = Object.entries(patterns)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([pt, count]) => ({
                    text: pt,
                    count: count,
                    // Find an example
                    example: memos.find(m => m.aiCache?.english?.toLowerCase().startsWith(pt))?.aiCache?.english
                }));

            setStats({
                total: memos.length,
                patterns: sortedPatterns,
                history: memos.slice(0, 20) // Top 20 recent
            });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading Data...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Learning Insights</h1>
                <p className={styles.sub}>Total Completed: <strong>{stats?.total || 0}</strong></p>
            </header>

            {/* Pattern Analysis */}
            <section className={styles.section}>
                <div className={styles.secTitle}>
                    <Sparkles size={20} className={styles.iconAccent} />
                    <h2>Frequent Patterns</h2>
                </div>

                {stats?.patterns?.length > 0 ? (
                    <div className={styles.patternGrid}>
                        {stats.patterns.map((p, i) => (
                            <div key={i} className={styles.patternCard}>
                                <div className={styles.pHeader}>
                                    <span className={styles.pText}>{p.text}...</span>
                                    <span className={styles.pCount}>{p.count}x</span>
                                </div>
                                <p className={styles.pExample}>"{cleanText(p.example)}"</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <p>No patterns detected yet.<br />Complete more memos!</p>
                    </div>
                )}
            </section>

            {/* Recent History */}
            <section className={styles.section}>
                <div className={styles.secTitle}>
                    <List size={20} className={styles.iconAccent} />
                    <h2>Recent History</h2>
                </div>

                <div className={styles.historyList}>
                    {stats?.history?.map(m => (
                        <div key={m.id} className={styles.historyCard}>
                            <div className={styles.hContent}>
                                <p className={styles.hJp}>{m.jpText}</p>
                                <p className={styles.hEn}>{cleanText(m.aiCache?.english || m.aiCache?.best)}</p>
                            </div>
                            <div className={styles.hMeta}>
                                <Clock size={12} />
                                <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                                <span className={styles.statusDone}>Done</span>
                            </div>
                        </div>
                    ))}
                    {(!stats?.history || stats.history.length === 0) && (
                        <p className={styles.empty}>No history yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
