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
    const [startX, setStartX] = useState(null);
    const [offsetX, setOffsetX] = useState(0);
    const threshold = 100; // Require a decent swipe

    const handleTouchStart = (e) => {
        setStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        if (!startX) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        setOffsetX(diff);
    };

    const handleTouchEnd = () => {
        if (offsetX > threshold) {
            // Right Swipe -> Complete
            onAction('complete', memo);
        } else if (offsetX < -threshold) {
            // Left Swipe -> Delete
            onAction('delete', memo);
        }
        setOffsetX(0);
        setStartX(null);
    };

    const style = {
        transform: `translateX(${offsetX}px)`,
        transition: startX ? 'none' : 'transform 0.3s ease',
    };

    let bgColor = 'transparent';
    if (offsetX > 20) bgColor = 'var(--color-primary)'; // Blue/Green for Done
    if (offsetX < -20) bgColor = 'var(--color-error)';   // Red for Delete

    return (
        <div className={styles.itemWrapper} style={{ backgroundColor: bgColor }}>
            {/* Left Background (Visible on Right Swipe) => Complete */}
            <div className={`${styles.actionIndicator} ${styles.actionLeft}`} style={{ opacity: offsetX > 20 ? 1 : 0 }}>
                <Check size={28} color="white" />
                <span className={styles.actionText}>完了</span>
            </div>

            {/* Right Background (Visible on Left Swipe) => Delete */}
            <div className={`${styles.actionIndicator} ${styles.actionRight}`} style={{ opacity: offsetX < -20 ? 1 : 0 }}>
                <Trash2 size={28} color="white" />
                <span className={styles.actionText}>削除</span>
            </div>

            <div
                className={styles.item}
                style={style}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <Link href={`/memo/${memo.id}`} className={styles.linkOverlay}>
                    <div className={styles.content}>
                        <p className={styles.text}>{memo.jpText}</p>
                        <div className={styles.meta}>
                            <Clock size={12} className={styles.icon} />
                            <span>{formatDate(memo.createdAt)}</span>
                            {memo.aiCache && <span className={styles.badge}>EN</span>}
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
