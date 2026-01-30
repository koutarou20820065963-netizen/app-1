'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Mic, StopCircle, ArrowRight, List, Archive, CheckCircle, Check } from 'lucide-react';
import MemoInput from '@/components/MemoInput';
import MemoResult from '@/components/MemoResult';
import { addMemo, getMemos, updateMemo } from '@/lib/db';
import styles from './page.module.css';

export default function Home() {
    const [memo, setMemo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorLine, setErrorLine] = useState('');

    // Real counts for buttons
    const [queueCount, setQueueCount] = useState(0);

    const loadCounts = () => {
        getMemos('unprocessed').then(ms => setQueueCount(ms.length));
    };

    useEffect(() => {
        loadCounts();
    }, [memo]);

    const handleMemoSubmit = async (text) => {
        setLoading(true);
        setMemo({ jpText: text });
        setErrorLine('');

        try {
            // 1. Save to DB (Unprocessed)
            const saved = await addMemo(text);
            setMemo(prev => ({ ...prev, id: saved.id }));

            // 2. Call AI
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jpText: text })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Translation failed');

            // 3. Update with AI result
            setMemo(prev => ({ ...prev, aiCache: data }));
            loadCounts(); // Update count immediately (though technically +1 unprocessed)

        } catch (err) {
            console.error(err);
            setErrorLine(err.message || "Error generating text.");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkDone = async () => {
        if (memo && memo.id) {
            await updateMemo(memo.id, { status: 'done' });
            setMemo(null); // Clear result view
            loadCounts();
        }
    };

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={styles.logo}>Instant Memo</div>
                <Link href="/test" className={styles.testLink}>
                    Test Mode
                </Link>
            </header>

            <div className={styles.scrollArea}>
                {/* Navigation Cards - Always Visible */}
                <div className={styles.navGrid}>
                    <Link href="/queue" className={styles.navCard}>
                        <div className={styles.navIconBox}><List size={24} /></div>
                        <div className={styles.navInfo}>
                            <span className={styles.navLabel}>未処理リスト</span>
                            <span className={styles.navCount}>{queueCount}件</span>
                        </div>
                        <ArrowRight size={20} className={styles.navArrow} />
                    </Link>

                    <Link href="/archive" className={styles.navCard}>
                        <div className={styles.navIconBox}><CheckCircle size={24} /></div>
                        <div className={styles.navInfo}>
                            <span className={styles.navLabel}>完了リスト</span>
                        </div>
                        <ArrowRight size={20} className={styles.navArrow} />
                    </Link>
                </div>

                {/* Current Result Display (Below Cards) */}
                {memo ? (
                    <div className={styles.resultContainer}>
                        <div className={styles.resultHeader}>New Memo</div>
                        <MemoResult memo={memo} isGenerating={loading} onMarkDone={handleMarkDone} />
                        {errorLine && <div className={styles.error}>{errorLine}</div>}

                        {!loading && memo.aiCache && (
                            <div className={styles.resultActions}>
                                <button className={styles.actionBtnDone} onClick={handleMarkDone}>
                                    <Check size={18} /> 完了にする
                                </button>
                                <button className={styles.actionBtnSecondary} onClick={() => setMemo(null)}>
                                    閉じる (あとでやる)
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Placeholder */
                    <div className={styles.placeholder}>
                        <p>最近のメモはありません。<br />下のフォームから入力してください。</p>
                    </div>
                )}
            </div>

            <div className={styles.inputWrapper}>
                <MemoInput onSubmit={handleMemoSubmit} disabled={loading} />
            </div>
        </main>
    );
}
