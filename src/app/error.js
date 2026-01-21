'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/globals.css'; // Access global vars if needed, but we'll use inline or minimal styles for safety

export default function Error({ error, reset }) {
    const router = useRouter();

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '20px',
            textAlign: 'center',
            background: 'var(--background)',
            color: 'var(--foreground)'
        }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                エラーが発生しました
            </h2>
            <p style={{ marginBottom: '2rem', color: '#666' }}>
                申し訳ありません。予期せぬエラーが発生しました。
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '10px 20px',
                        background: 'var(--foreground)',
                        color: 'var(--background)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    再読み込み
                </button>
                <button
                    onClick={() => router.push('/')}
                    style={{
                        padding: '10px 20px',
                        background: '#f0f0f0',
                        color: '#333',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    ホームへ戻る
                </button>
            </div>
        </div>
    );
}
