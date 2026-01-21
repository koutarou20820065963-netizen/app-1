'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive } from 'lucide-react';
import { getMemos } from '../../lib/db';
import MemoList from '../../components/MemoList';
import styles from './page.module.css';

export default function QueuePage() {
    const [memos, setMemos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMemos = async () => {
        setLoading(true);
        try {
            const data = await getMemos('unprocessed');
            setMemos(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMemos();
    }, []);

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className={styles.title}>未処理リスト</h1>
                <Link href="/archive" className={styles.archiveLink}>
                    <Archive size={20} />
                </Link>
            </header>

            <div className={styles.listSection}>
                {loading ? (
                    <div className={styles.loading}>読み込み中...</div>
                ) : (
                    <MemoList memos={memos} emptyMessage="未処理のメモはありません。全て完了です！" onRefresh={fetchMemos} />
                )}
            </div>
        </main>
    );
}
