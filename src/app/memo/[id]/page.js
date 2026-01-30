'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Loader2, Check } from 'lucide-react';
import { getMemo, updateMemo } from '../../../lib/db';
import MemoResult from '../../../components/MemoResult';
import styles from './page.module.css';

export default function MemoDetail({ params }) {
    const router = useRouter();
    const [memo, setMemo] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(true);

    const [unwrappedId, setUnwrappedId] = useState(null);

    useEffect(() => {
        if (params instanceof Promise) {
            params.then(p => setUnwrappedId(p.id));
        } else {
            setUnwrappedId(params?.id);
        }
    }, [params]);

    useEffect(() => {
        async function load() {
            if (!unwrappedId) return;
            try {
                const data = await getMemo(unwrappedId);
                if (!data) {
                    router.replace('/queue');
                    return;
                }
                setMemo(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [unwrappedId, router]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jpText: memo.jpText }),
            });
            // Handle error response as valid json fallback if possible
            const aiResult = await res.json();

            const updated = await updateMemo(memo.id, { aiCache: aiResult });
            setMemo(updated);
        } catch (e) {
            alert('AI生成に失敗しました');
        } finally {
            setGenerating(false);
        }
    };

    const handleMarkDone = async () => {
        try {
            if (memo.status === 'unprocessed') {
                await updateMemo(memo.id, { status: 'done' });
                router.push('/queue');
            } else {
                // Undo
                await updateMemo(memo.id, { status: 'unprocessed' });
                router.push('/archive');
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className={styles.loading}>読み込み中...</div>;
    if (!memo) return <div className={styles.loading}>見つかりません</div>;

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <Link href={memo.status === 'done' ? '/archive' : '/queue'} className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <div className={styles.date}>
                    {new Date(memo.createdAt).toLocaleString('ja-JP')}
                </div>
            </header>

            {/* If no AI result yet and not generating, show original text and convert button */}
            {!memo.aiCache && !generating && (
                <>
                    <div className={styles.card}>
                        <h2 className={styles.jpText}>{memo.jpText}</h2>
                    </div>
                    <div className={styles.actionSection}>
                        <button
                            className={styles.generateButton}
                            onClick={handleGenerate}
                        >
                            <Sparkles size={20} /> 英語に変換
                        </button>
                    </div>
                </>
            )}

            {/* If has result or is generating, show Result Card */}
            {(memo.aiCache || generating) && (
                <MemoResult
                    memo={memo}
                    onMarkDone={handleMarkDone}
                    isGenerating={generating}
                />
            )}

            {/* Complete Button Footer */}
            {memo.status === 'unprocessed' && memo.aiCache && !generating && (
                <div className={styles.footerAction}>
                    <button className={styles.completeButton} onClick={handleMarkDone}>
                        <Check size={20} /> 復習完了 (リストから消す)
                    </button>
                </div>
            )}
        </main >
    );
}
