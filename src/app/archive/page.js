'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Inbox } from 'lucide-react';
import { getMemos } from '../../lib/db';
import MemoList from '../../components/MemoList';
import styles from '../queue/page.module.css'; // Reusing queue styles

export default function ArchivePage() {
    const [memos, setMemos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getMemos('done');
                setMemos(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <Link href="/queue" className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className={styles.title}>処理済みアーカイブ</h1>
                <Link href="/queue" className={styles.archiveLink}>
                    <Inbox size={20} />
                </Link>
            </header>

            {loading ? (
                <div className={styles.loading}>読み込み中...</div>
            ) : (
                <MemoList memos={memos} emptyMessage="処理済みのメモはありません。" />
            )}
        </main>
    );
}
