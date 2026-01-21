'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMemos, updateMemo } from '../lib/db';
import MemoInput from '../components/MemoInput';
import styles from './page.module.css';
import { Sparkles, ChevronDown, ChevronUp, Volume2, Check } from 'lucide-react';

export default function Home() {
    const [unprocessedCount, setUnprocessedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [latestMemo, setLatestMemo] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAlts, setShowAlts] = useState(false);

    const fetchCount = async () => {
        try {
            const memos = await getMemos('unprocessed');
            setUnprocessedCount(memos.length);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCount();
    }, []);

    const handleSave = async (newMemo) => {
        await fetchCount();
        setLatestMemo(newMemo);
        setIsGenerating(true);
        setShowAlts(false); // Reset alts visibility

        try {
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jpText: newMemo.jpText }),
            });

            // Even if 400/500, we expect JSON error from our API
            const aiResult = await res.json();

            // Update DB with result
            const updated = await updateMemo(newMemo.id, { aiCache: aiResult });
            setLatestMemo(updated);
        } catch (e) {
            console.error("Generation failed", e);
            const errorResult = {
                best: "通信エラー",
                alts: ["ネット接続を確認してください"],
                notes: "サーバーに接続できませんでした",
                example: "Network Error",
                pronounceText: "Error"
            };
            const updated = await updateMemo(newMemo.id, { aiCache: errorResult });
            setLatestMemo(updated);
        } finally {
            setIsGenerating(false);
        }
    };

    const playAudio = (text) => {
        if (!window.speechSynthesis) return;
        const uttr = new SpeechSynthesisUtterance(text);
        uttr.lang = 'en-US';
        window.speechSynthesis.speak(uttr);
    };

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Instant Memo</h1>
                <Link href="/queue" className={styles.counterLink}>
                    未処理: <span className={styles.count}>{loading ? '-' : unprocessedCount}</span>
                </Link>
            </div>

            {/* Input Section */}
            <div className={styles.inputSection}>
                <MemoInput onSave={handleSave} />
            </div>

            {/* Immediate Result Section */}
            {latestMemo && (
                <div className={styles.resultCard}>
                    <div className={styles.resultHeader}>
                        <span className={styles.jpPreview}>{latestMemo.jpText}</span>
                        {isGenerating && <span className={styles.generating}><Sparkles size={14} /> 変換中...</span>}
                    </div>

                    {!isGenerating && latestMemo.aiCache && (
                        <div className={styles.resultBody}>
                            <div className={styles.bestContainer}>
                                <div className={styles.bestLabel}>おすすめ (Best)</div>
                                <div className={styles.bestText}>
                                    {latestMemo.aiCache.best}
                                    <button onClick={() => playAudio(latestMemo.aiCache.best)} className={styles.iconBtn}>
                                        <Volume2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.altsContainer}>
                                <button
                                    className={styles.altsToggle}
                                    onClick={() => setShowAlts(!showAlts)}
                                >
                                    {showAlts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    他の言い方 (Alternatives)
                                </button>

                                {showAlts && (
                                    <ul className={styles.altsList}>
                                        {latestMemo.aiCache.alts.map((alt, i) => (
                                            <li key={i}>{alt}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!latestMemo && (
                <p className={styles.hint}>
                    会話で言えなかったことを日本語でメモ。<br />
                    AIがすぐに英語にしてくれます。
                </p>
            )}
        </main>
    );
}
