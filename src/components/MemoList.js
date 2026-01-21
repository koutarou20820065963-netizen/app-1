'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, Check, RotateCcw } from 'lucide-react';
import { updateMemo } from '../lib/db';
import styles from './MemoList.module.css';

export default function MemoList({ memos, emptyMessage = 'メモはありません', onRefresh }) {
    const [undoMemo, setUndoMemo] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const toastTimeoutRef = useRef(null);

    const handleComplete = async (memo) => {
        try {
            await updateMemo(memo.id, { status: 'done' });
            if (onRefresh) onRefresh();

            // Setup Undo
            setUndoMemo(memo);
            setShowToast(true);

            // Auto hide toast
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = setTimeout(() => {
                setShowToast(false);
                setUndoMemo(null);
            }, 3000);
        } catch (e) {
            console.error(e);
        }
    };

    const handleUndo = async () => {
        if (!undoMemo) return;
        try {
            await updateMemo(undoMemo.id, { status: 'unprocessed' });
            if (onRefresh) onRefresh();
            setShowToast(false);
            setUndoMemo(null);
        } catch (e) {
            console.error(e);
        }
    };

    if (!memos || memos.length === 0) {
        return <div className={styles.empty}>{emptyMessage}</div>;
    }

    const formatDate = (isoString) => {
        const d = new Date(isoString);
        return new Intl.DateTimeFormat('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    };

    return (
        <div className={styles.listContainer}> {/* Wrapper for relative Toast positioning */}
            <div className={styles.list}>
                {memos.map((memo) => (
                    <SwipeableItem
                        key={memo.id}
                        memo={memo}
                        formatDate={formatDate}
                        onComplete={() => handleComplete(memo)}
                    />
                ))}
            </div>

            {/* Undo Toast */}
            {showToast && (
                <div className={styles.undoToast}>
                    <span>完了しました</span>
                    <button onClick={handleUndo} className={styles.undoButton}>
                        <RotateCcw size={16} /> 元に戻す
                    </button>
                </div>
            )}
        </div>
    );
}

function SwipeableItem({ memo, formatDate, onComplete }) {
    const [startX, setStartX] = useState(null);
    const [startY, setStartY] = useState(null);
    const [offsetX, setOffsetX] = useState(0);
    const threshold = 100; // px to trigger action

    const handleTouchStart = (e) => {
        setStartX(e.touches[0].clientX);
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        if (!startX) return;
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - startX;
        const diffY = currentY - startY;

        // Ignore if vertical scroll is dominant (stricter check)
        if (Math.abs(diffY) * 1.2 > Math.abs(diffX)) return;

        // Only allow right swipe (positive diff)
        if (diffX > 0) {
            // Prevent default to stop scrolling while swiping
            // Note: passive event listeners cannot allow preventDefault in some cases,
            // but React synthetic events usually handle it or we accept scroll locking isn't perfect.
            // For now, simpler is better.
            setOffsetX(diffX);
        }
    };

    const handleTouchEnd = async () => {
        if (offsetX > threshold) {
            onComplete();
            setOffsetX(0); // Reset for next mount (though usually unmounted)
        } else {
            // Reset
            setOffsetX(0);
        }
        setStartX(null);
        setStartY(null);
    };

    const style = {
        transform: `translateX(${offsetX}px)`,
        transition: startX ? 'none' : 'all 0.3s ease',
    };

    return (
        <div className={styles.itemWrapper}>
            <div className={styles.backgroundAction} style={{ opacity: offsetX > 20 ? 1 : 0 }}>
                <Check size={24} color="white" />
                <span className={styles.actionText}>完了</span>
            </div>

            <Link
                href={`/memo/${memo.id}`}
                className={styles.item}
                style={style}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className={styles.content}>
                    <p className={styles.text}>{memo.jpText}</p>
                    <div className={styles.meta}>
                        <Clock size={14} className={styles.icon} />
                        <span>{formatDate(memo.createdAt)}</span>
                        {memo.aiCache && <span className={styles.badge}>EN</span>}
                    </div>
                </div>
                <ChevronRight className={styles.chevron} size={20} />
            </Link>
        </div>
    );
}
