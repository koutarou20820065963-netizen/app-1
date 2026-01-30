'use client';

import { useState } from 'react';
import { Volume2, Copy, ChevronDown, ChevronUp, Check, Sparkles, AlertTriangle, Lightbulb, List } from 'lucide-react';
import styles from './MemoResult.module.css';

export default function MemoResult({ memo, onMarkDone, isGenerating }) {
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
    const english = aiCache.english || aiCache.best;
    const analysis = aiCache.analysis || {};
    const { points = [], improvedPhrases = [], cautions = [] } = analysis;

    if (!aiCache.english && !aiCache.best) return null;

    const [expanded, setExpanded] = useState({ points: true, phrases: true });
    const [showToast, setShowToast] = useState(false);

    const toggle = (key) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const playAudio = (text) => {
        if (!window.speechSynthesis) return;
        const target = text || aiCache.pronounceText || english;
        const uttr = new SpeechSynthesisUtterance(target);
        uttr.lang = 'en-US';
        window.speechSynthesis.speak(uttr);
    };

    const copyToClipboard = async (text) => {
        const target = text || english;
        if (!target) return;
        try {
            await navigator.clipboard.writeText(target);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    // Helper to strip markdown stars
    const cleanText = (text) => {
        if (!text) return '';
        return text.replace(/\*\*/g, '');
    };

    return (
        <div className={styles.card}>
            {/* Header: Original JP */}
            <div className={styles.originalSection}>
                <div className={styles.jpText}>{memo.jpText}</div>
            </div>

            {/* English Result */}
            <div className={styles.englishSection}>
                <div className={styles.labelRow}>
                    <span className={styles.label}>English</span>
                    <div className={styles.actions}>
                        <button onClick={() => playAudio()} className={styles.iconBtn} aria-label="読み上げ">
                            <Volume2 size={18} />
                        </button>
                        <button onClick={() => copyToClipboard()} className={styles.iconBtn} aria-label="コピー">
                            <Copy size={18} />
                        </button>
                    </div>
                </div>
                <div className={styles.englishText}>{english}</div>
            </div>

            {/* Structured Analysis */}
            <div className={styles.analysisContainer}>

                {/* 1. Points */}
                {points.length > 0 && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader} onClick={() => toggle('points')}>
                            <Lightbulb size={16} className={styles.iconPoint} />
                            <h4>解説・ポイント</h4>
                            {expanded.points ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                        {expanded.points && (
                            <ul className={styles.pointList}>
                                {points.map((p, i) => <li key={i}>{cleanText(p)}</li>)}
                            </ul>
                        )}
                    </div>
                )}

                {/* 2. Improved Phrases (Bilingual) */}
                {improvedPhrases.length > 0 && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader} onClick={() => toggle('phrases')}>
                            <List size={16} className={styles.iconPhrase} />
                            <h4>他の表現</h4>
                            {expanded.phrases ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                        {expanded.phrases && (
                            <ul className={styles.phraseList}>
                                {improvedPhrases.map((item, i) => {
                                    const isObj = typeof item === 'object' && item !== null;
                                    const enText = isObj ? item.en : item;
                                    const jaText = isObj ? item.ja : null;

                                    return (
                                        <li key={i} className={styles.phraseItem}>
                                            <div className={styles.phraseEn}>
                                                {enText}
                                                <button onClick={() => playAudio(enText)} className={styles.miniVol}>
                                                    <Volume2 size={14} />
                                                </button>
                                            </div>
                                            {jaText && <div className={styles.phraseJa}>{cleanText(jaText)}</div>}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}

                {/* 3. Cautions */}
                {cautions.length > 0 && (
                    <div className={styles.cautionBox}>
                        <div className={styles.cautionTitle}><AlertTriangle size={14} /> 注意点</div>
                        <ul className={styles.cautionList}>
                            {cautions.map((c, i) => <li key={i}>{cleanText(c)}</li>)}
                        </ul>
                    </div>
                )}
            </div>

            {/* Toast */}
            {showToast && (
                <div className={`${styles.toast} ${showToast ? styles.showToast : ''}`}>
                    Copied!
                </div>
            )}
        </div>
    );
}
