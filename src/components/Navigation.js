'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, BookOpen } from 'lucide-react';
import styles from './Navigation.module.css';

export default function Navigation() {
    const pathname = usePathname();

    const isActive = (path) => pathname === path || pathname.startsWith(path + '/');
    // Special case for home "/" to not match everything
    const isHome = pathname === '/' || pathname.startsWith('/queue') || pathname.startsWith('/memo') || pathname.startsWith('/archive');

    // Actually, distinct tabs:
    // Home: /, /queue, /archive, /memo/*
    // Insights: /insights
    // Test: /test

    return (
        <nav className={styles.nav}>
            <Link href="/" className={`${styles.item} ${isHome && !pathname.includes('/insights') && !pathname.includes('/test') ? styles.active : ''}`}>
                <Home size={24} />
                <span className={styles.label}>ホーム</span>
            </Link>
            <Link href="/test" className={`${styles.item} ${isActive('/test') ? styles.active : ''}`}>
                <BookOpen size={24} />
                <span className={styles.label}>テスト</span>
            </Link>
            <Link href="/insights" className={`${styles.item} ${isActive('/insights') ? styles.active : ''}`}>
                <BarChart2 size={24} />
                <span className={styles.label}>分析</span>
            </Link>
        </nav>
    );
}
