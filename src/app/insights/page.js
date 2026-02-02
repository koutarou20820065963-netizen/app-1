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
            // Fetch 'done' and 'unprocessed'
            const [doneMemos, todoMemos] = await Promise.all([
                getMemos('done'),
                getMemos('unprocessed')
            ]);

            const allMemos = [...doneMemos, ...todoMemos];

            // Mastery Levels
            const levels = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            allMemos.forEach(m => {
                const lvl = m.level || 0;
                levels[Math.min(lvl, 5)] = (levels[Math.min(lvl, 5)] || 0) + 1;
            });

            // ... pattern logic on doneMemos ...
            const memos = doneMemos; // Used for patterns

            // ... (keep pattern logic) ...

            setStats({
                total: allMemos.length,
                doneCount: doneMemos.length,
                todoCount: todoMemos.length,
                patterns: sortedPatterns,
                history: doneMemos.slice(0, 20),
                levels
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
            </header>

            <section className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total</span>
                    <span className={styles.statValue}>{stats?.total || 0}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Done</span>
                    <span className={styles.statValue}>{stats?.doneCount || 0}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Pending</span>
                    <span className={styles.statValue}>{stats?.todoCount || 0}</span>
                </div>
            </section>

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
