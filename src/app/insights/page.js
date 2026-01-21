'use client';

import { useState, useEffect } from 'react';
import { getAllMemos, updateMemo } from '../../lib/db';
import styles from './page.module.css';
import { Calendar, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// ... existing imports ...

export default function InsightsPage() {
    const [stats, setStats] = useState(null);
    const [todaysReview, setTodaysReview] = useState([]);
    const [loading, setLoading] = useState(true);

    const selectReviewItems = (memos) => {
        const doneMemos = memos.filter(m => m.status === 'done');
        const now = new Date();

        // 1. Due Items
        const due = doneMemos.filter(m => m.review?.nextReviewAt && new Date(m.review.nextReviewAt) <= now);

        // 2. Weak Items (Last score < 80)
        const weak = doneMemos.filter(m => {
            if (due.includes(m)) return false;
            const lastAttempt = m.review?.attempts?.[m.review.attempts.length - 1];
            return lastAttempt && lastAttempt.score < 80;
        });

        // 3. Low Confidence Tags (< 70)
        const uncertain = doneMemos.filter(m => {
            if (due.includes(m) || weak.includes(m)) return false;
            return m.tags?.confidence && m.tags.confidence < 70;
        });

        // 4. Random Fill
        const others = doneMemos.filter(m => !due.includes(m) && !weak.includes(m) && !uncertain.includes(m));
        const randomFill = others.sort(() => 0.5 - Math.random());

        // Combine unique items
        return [...due, ...weak, ...uncertain, ...randomFill].slice(0, 3);
    };

    const calculateStats = (memos) => {
        // ... (existing logic) ...
        const topics = {};
        const patterns = {};
        let taggedCount = 0;
        let totalScore = 0;
        let scoreCount = 0;

        memos.forEach(m => {
            if (m.tags) {
                taggedCount++;
                if (m.tags.topic) topics[m.tags.topic] = (topics[m.tags.topic] || 0) + 1;
                if (m.tags.pattern) patterns[m.tags.pattern] = (patterns[m.tags.pattern] || 0) + 1;
            }
            // Calc average score
            if (m.review?.attempts?.length > 0) {
                const lastScore = m.review.attempts[m.review.attempts.length - 1].score;
                totalScore += lastScore;
                scoreCount++;
            }
        });

        const sortObj = (obj) => Object.entries(obj)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        return {
            total: memos.length,
            taggedCount,
            topTopics: sortObj(topics),
            topPatterns: sortObj(patterns),
            untagged: memos.filter(m => !m.tags && m.aiCache),
            avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
            completionRate: memos.length > 0 ? Math.round((memos.filter(m => m.status === 'done').length / memos.length) * 100) : 0
        };
    };

    const loadStats = async () => {
        setLoading(true);
        try {
            const memos = await getAllMemos();
            const s = calculateStats(memos);
            setStats(s);
            setTodaysReview(selectReviewItems(memos));

            // Auto-tagging ... (existing) ...
            const candidate = s.untagged[0];
            if (candidate) {
                autoTag(candidate);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // ... autoTag ...
    const autoTag = async (memo) => {
        try {
            const res = await fetch('/api/tag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jpText: memo.jpText, enText: memo.aiCache.best }),
            });
            if (res.ok) {
                const tags = await res.json();
                await updateMemo(memo.id, { tags });
            }
        } catch (e) {
            console.error("Auto-tag failed", e);
        }
    };


    useEffect(() => {
        loadStats();
    }, []);

    if (loading) return <div className={styles.container}><div className={styles.loading}>読み込み中...</div></div>;

    return (
        <main className={styles.container}>
            <h1 className={styles.title}>学習分析</h1>

            {/* Today's Review Action */}
            <div className={styles.actionCard}>
                <div className={styles.cardHeader}>
                    <Calendar size={20} className={styles.iconAccent} />
                    <span>今日の復習</span>
                </div>
                {todaysReview.length > 0 ? (
                    <div className={styles.reviewContent}>
                        <div className={styles.reviewList}>
                            {todaysReview.map(m => (
                                <div key={m.id} className={styles.reviewItem}>
                                    <span className={styles.truncate}>{m.jpText}</span>
                                    {m.review?.nextReviewAt && new Date(m.review.nextReviewAt) <= new Date() &&
                                        <span className={styles.badgeDue}>期限</span>}
                                    {m.tags?.confidence < 70 &&
                                        <span className={styles.badgeCheck}>要確認</span>}
                                </div>
                            ))}
                        </div>
                        <Link href="/test" className={styles.reviewButton}>
                            テストを開始 <ArrowRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <p className={styles.goodEval}>現在は復習推奨アイテムがありません！<br />どんどんメモを追加しましょう。</p>
                )}
            </div>

            <div className={styles.statGrid}>
                <div className={styles.statCard}>
                    <div className={styles.cardHeader}>
                        <PieChart size={20} />
                        <span>完了率</span>
                    </div>
                    <div className={styles.bigNum}>{stats.completionRate}<span className={styles.unit}>%</span></div>
                    <div className={styles.subText}>{stats.total}件中</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.cardHeader}>
                        <CheckCircle size={20} />
                        <span>平均スコア</span>
                    </div>
                    <div className={styles.bigNum}>{stats.avgScore}<span className={styles.unit}>点</span></div>
                </div>
            </div>

            {/* ... Existing Rankings ... */}
            <div className={styles.sectionHeader}>
                <List size={18} /> よく使うトピック
            </div>
            <div className={styles.ranking}>
                {stats.topTopics.length === 0 ? <p className={styles.empty}>データ収集中...</p> :
                    stats.topTopics.map(([topic, count], i) => (
                        <div key={topic} className={styles.rankItem}>
                            <span className={styles.rankNum}>{i + 1}</span>
                            <span className={styles.rankLabel}>{topic}</span>
                            <span className={styles.rankCount}>{count}</span>
                        </div>
                    ))
                }
            </div>

            <div className={styles.sectionHeader}>
                <Tag size={18} /> 苦手・頻出の型
            </div>
            <div className={styles.ranking}>
                {stats.topPatterns.length === 0 ? <p className={styles.empty}>データ収集中...</p> :
                    stats.topPatterns.map(([pattern, count], i) => (
                        <div key={pattern} className={styles.rankItem}>
                            <span className={styles.rankNum}>{i + 1}</span>
                            <span className={styles.rankLabel}>{pattern}</span>
                            <span className={styles.rankCount}>{count}</span>
                        </div>
                    ))
                }
            </div>
        </main>
    );
}
