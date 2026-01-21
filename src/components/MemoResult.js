'use client';

import { useState } from 'react';
import { Volume2, Copy, ChevronDown, ChevronUp, Check, Sparkles } from 'lucide-react';
import styles from './MemoResult.module.css';

export default function MemoResult({ memo, onMarkDone, isGenerating }) {
    // If generating, show loading state
    if (isGenerating) {
        return (
            <div className={styles.card}>
                <div className={styles.header}>
                    <span className={styles.jpPreview}>{memo.jpText}</span>
                    <span className={styles.status}><Sparkles size={14} /> 変換中...</span>
                </div>
            </div>
        );
    }

    if (!memo || !memo.aiCache) return null;

    const { aiCache } = memo;
    const { best, alts, notes, notesJa, example, exampleEn, exampleJa, pronounceText } = aiCache;

    // Normalize data for compatibility
    const displayNotes = notesJa || notes;
    const displayExample = exampleEn || example;
    const displayExampleJa = exampleJa; // might be undefined

    const [expanded, setExpanded] = useState({ alts: false, notes: false, example: false });
    const [showToast, setShowToast] = useState(false);

    const toggle = (key) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const playAudio = () => {
        if (!window.speechSynthesis) return;
        const uttr = new SpeechSynthesisUtterance(pronounceText || best);
        uttr.lang = 'en-US';
        window.speechSynthesis.speak(uttr);
    };

    const copyToClipboard = async () => {
        if (!best) return;
        try {
            await navigator.clipboard.writeText(best);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    return (
        <div className={styles.card}>
            {/* Header: Original JP */}
            <div className={styles.originalSection}>
                <div className={styles.jpText}>{memo.jpText}</div>
            </div>

            {/* Best Result */}
            <div className={styles.bestSection}>
                <div className={styles.labelRow}>
                    <span className={styles.label}>おすすめ</span>
                    <div className={styles.actions}>
                        <button onClick={playAudio} className={styles.iconBtn} aria-label="読み上げ">
                            <Volume2 size={18} />
                        </button>
                        <button onClick={copyToClipboard} className={styles.iconBtn} aria-label="コピー">
                            <Copy size={18} />
                        </button>
                    </div>
                </div>
                <div className={styles.bestText}>{best}</div>
            </div>

            {/* Collapsible Sections */}
            <div className={styles.accordionContainer}>
                {/* Alternatives */}
                {alts && alts.length > 0 && (
                    <div className={styles.accordionItem}>
                        <button
                            className={styles.accordionHeader}
                            onClick={() => toggle('alts')}
                            aria-expanded={expanded.alts}
                        >
                            <span className={styles.accordionTitle}>他の言い方</span>
                            {expanded.alts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {expanded.alts && (
                            <ul className={styles.altsList}>
                                {alts.map((alt, i) => (
                                    <li key={i}>{alt}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Notes */}
                {displayNotes && (
                    <div className={styles.accordionItem}>
                        <button
                            className={styles.accordionHeader}
                            onClick={() => toggle('notes')}
                            aria-expanded={expanded.notes}
                        >
                            <span className={styles.accordionTitle}>解説</span>
                            {expanded.notes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {expanded.notes && (
                            <div className={styles.accordionContent}>
                                <p>{displayNotes}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Example */}
                {displayExample && (
                    <div className={styles.accordionItem}>
                        <button
                            className={styles.accordionHeader}
                            onClick={() => toggle('example')}
                            aria-expanded={expanded.example}
                        >
                            <span className={styles.accordionTitle}>例文</span>
                            {expanded.example ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {expanded.example && (
                            <div className={styles.accordionContent}>
                                <p className={styles.enExample}>{displayExample}</p>
                                {displayExampleJa && <p className={styles.jaExample}>{displayExampleJa}</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            {showToast && (
                <div className={`${styles.toast} ${showToast ? styles.showToast : ''}`}>
                    コピーしました
                </div>
            )}

            {/* Review Done Button */}
            {onMarkDone && (
                <button className={styles.doneButton} onClick={onMarkDone}>
                    <Check size={20} />
                    {memo.status === 'unprocessed' ? '復習完了' : '未処理に戻す'}
                </button>
            )}
        </div>
    );
}
