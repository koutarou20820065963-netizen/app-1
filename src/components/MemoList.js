'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, Check, Trash2, RotateCcw } from 'lucide-react';
import { updateMemo, deleteMemo, addMemo } from '../lib/db'; // Client-side DB wrappers
import styles from './MemoList.module.css';

export default function MemoList({ memos, emptyMessage = 'メモはありません', onRefresh }) {
    const [undoState, setUndoState] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const toastTimeoutRef = useRef(null);

    const handleAction = async (action, memo) => {
        try {
            if (action === 'complete') {
                await updateMemo(memo.id, { status: 'done' });
                setUndoState({ type: 'complete', memo: { ...memo } }); // Clone to be safe
            } else if (action === 'delete') {
                await deleteMemo(memo.id);
                setUndoState({ type: 'delete', memo: { ...memo } });
            }
            if (onRefresh) onRefresh();

            setShowToast(true);
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = setTimeout(() => {
                setShowToast(false);
                setUndoState(null);
            }, 5000);
        } catch (e) {
            console.error(e);
        }
    };

    const handleUndo = async () => {
        if (!undoState) return;
        try {
            if (undoState.type === 'complete') {
                // Revert to 'unprocessed'
                await updateMemo(undoState.memo.id, { status: 'unprocessed' });
            } else if (undoState.type === 'delete') {
                // Restore logic 
                // Since this uses IDB or Mock, simply re-adding might change ID
                // Ideally backend restore, but if we use simple addMemo it's a new ID.
                // Better if deleteMemo was soft-delete.
                // For now, let's re-add with same content.
                const restored = await addMemo(undoState.memo.jpText);
                if (undoState.memo.aiCache) {
                    await updateMemo(restored.id, { aiCache: undoState.memo.aiCache });
                }
            }
            if (onRefresh) onRefresh();
            setShowToast(false);
            setUndoState(null);
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
            month: 'numeric', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        }).format(d);
    };

    return (
        <div className={styles.listContainer}>
            <div className={styles.list}>
                {memos.map((memo) => (
                    <SwipeableItem
                        key={memo.id}
                        memo={memo}
                        formatDate={formatDate}
                        onAction={handleAction}
                    />
                ))}
            </div>

            <div className={`${styles.toast} ${showToast ? styles.showToast : ''}`}>
                <span>{undoState?.type === 'delete' ? '削除しました' : '完了リストへ移動しました'}</span>
                <button onClick={handleUndo} className={styles.undoButton}>
                    <RotateCcw size={14} /> 元に戻す
                </button>
            </div>
        </div>
    );
}

function SwipeableItem({ memo, formatDate, onAction }) {
    const [offsetX, setOffsetX] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const startX = useRef(null);
    const itemRef = useRef(null);
    const threshold = 70; // Slightly higher threshold to prevent accidental swipes

    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        if (startX.current === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;
        // Limit scroll to horizontal only roughly?
        setOffsetX(diff);
    };

    const handleTouchEnd = () => {
        if (offsetX > threshold) {
            // Right => Complete
            triggerAction('complete');
        } else if (offsetX < -threshold) {
            // Left => Delete
            triggerAction('delete');
        } else {
            // Reset
            setOffsetX(0);
        }
        startX.current = null;
    };

    const triggerAction = (type) => {
        setIsExiting(true);
        // Wait for animation
        setTimeout(() => {
            onAction(type, memo);
            // We don't reset Exiting here because the item should ideally unmount.
            // But if it fails, Parent should handle re-fetching.
        }, 300);
    };

    const style = {
        transform: `translateX(${offsetX}px)`,
        transition: startX.current !== null ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        opacity: isExiting ? 0 : 1
    };

    // Action Background Colors and Icons
    let bgColor = 'transparent';
    let leftOpacity = 0;
    let rightOpacity = 0;

    if (offsetX > 20) {
        bgColor = 'var(--color-primary)';
        leftOpacity = Math.min(offsetX / threshold, 1);
    }
    if (offsetX < -20) {
        bgColor = 'var(--color-error)';
        rightOpacity = Math.min(Math.abs(offsetX) / threshold, 1);
    }

    if (isExiting) return <div style={{ height: 0, transition: 'height 0.3s', margin: 0 }} />;

    return (
        <div className={styles.itemWrapper} style={{ backgroundColor: bgColor }}>
            {/* Complete Action (Left) */}
            <div className={`${styles.actionIndicator} ${styles.actionLeft}`} style={{ opacity: leftOpacity }}>
                <Check size={28} />
                <span className={styles.actionText}>完了</span>
            </div>

            {/* Delete Action (Right) */}
            <div className={`${styles.actionIndicator} ${styles.actionRight}`} style={{ opacity: rightOpacity }}>
                <Trash2 size={28} />
                <span className={styles.actionText}>削除</span>
            </div>

            <div
                className={`${styles.item} ${isExiting ? styles.exiting : ''}`}
                style={style}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <Link href={`/memo/${memo.id}`} className={styles.linkOverlay}>
                    <p className={styles.text}>{memo.jpText}</p>
                    {/* Compact English Subtext */}
                    {(memo.enText || (memo.aiCache && memo.aiCache.english)) && (
                        <p className={styles.subtext}>
                            {memo.enText || memo.aiCache.english}
                        </p>
                    )}
                </Link>
            </div>
        </div>
    );
}
