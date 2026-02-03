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

    const { aiCache, aiData, enText } = memo;
    const cache = aiCache || aiData;

    // Fallback: If no cache but enText exists (legacy partial), mock a cache
    const effectiveCache = cache || (enText ? { english: enText } : null);

    if (!effectiveCache) return null;

    const english = effectiveCache.english || effectiveCache.best;
    const analysis = effectiveCache.analysis || {};
    const { points = [], improvedPhrases = [], cautions = [] } = analysis;

    if (!english) return null;

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
            {/* 0. Context & Politeness (New Priority) */}
            {(analysis.context || analysis.politeness) && (
                <div className={styles.contextBox}>
                    {analysis.context?.meaning && (
                        <div className={styles.contextRow}>
                            <span className={styles.contextLabel}>意味・ニュアンス:</span>
                            <div>{cleanText(analysis.context.meaning)}</div>
                        </div>
                    )}
                    {analysis.context?.condition && (
                        <div className={styles.contextRow}>
                            <span className={styles.contextLabel}>使用場面:</span>
                            <div>{cleanText(analysis.context.condition)}</div>
                        </div>
                    )}
                    {analysis.politeness && (
                        <div className={styles.politenessRow}>
                            <span className={styles.contextLabel}>丁寧さ:</span>
                            <div className={styles.politenessMeter}>
                                {[1, 2, 3, 4, 5].map(l => {
                                    // Dynamic Colors
                                    let color = '#eee';
                                    if (l <= analysis.politeness.level) {
                                        const lev = analysis.politeness.level;
                                        if (lev <= 2) color = '#F59E0B';      // Casual (Amber)
                                        else if (lev === 3) color = '#10B981'; // Neutral (Green)
                                        else color = '#6366F1';               // Formal (Indigo)
                                    }
                                    return (
                                        <div
                                            key={l}
                                            className={styles.levelDot}
                                            style={{ backgroundColor: color }}
                                        />
                                    );
                                })}
                                <span className={styles.politenessDesc}>{analysis.politeness.description}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 0.5 Dialogue (New) */}
            {analysis.dialogue && analysis.dialogue.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader} onClick={() => toggle('dialogue')}>
                        <List size={16} className={styles.iconPhrase} />
                        <h4>会話例</h4>
                        {expanded.dialogue ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                    {expanded.dialogue !== false && (
                        <div className={styles.dialogueBox}>
                            {analysis.dialogue.map((line, i) => (
                                <div key={i} className={`${styles.dialogueRow} ${line.speaker === 'A' ? styles.speakerA : styles.speakerB}`}>
                                    <span className={styles.speakerLabel}>{line.speaker}:</span>
                                    <span className={styles.dialogueText}>
                                        {line.text}
                                        <button onClick={() => playAudio(line.text)} className={styles.miniVol}>
                                            <Volume2 size={12} />
                                        </button>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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
                            {points.map((p, i) => {
                                const isObj = typeof p === 'object' && p !== null;
                                const en = isObj ? p.en : p;
                                const ja = isObj ? p.ja : null;
                                const grammar = isObj ? p.grammar : null;
                                return (
                                    <li key={i} className={styles.pointItem}>
                                        <div className={styles.pointEn}>{cleanText(en)}</div>
                                        {ja && <div className={styles.pointJa}>{cleanText(ja)}</div>}
                                        {grammar && <div className={styles.pointTag}>{grammar}</div>}
                                    </li>
                                );
                            })}
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
                                // Should render type (formal/casual) if exists

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
                        {cautions.map((c, i) => {
                            const isObj = typeof c === 'object' && c !== null;
                            const en = isObj ? c.en : c;
                            const ja = isObj ? c.ja : null;
                            return (
                                <li key={i} className={styles.cautionItem}>
                                    <div className={styles.cautionEn}>{cleanText(en)}</div>
                                    {ja && <div className={styles.cautionJa}>{cleanText(ja)}</div>}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Toast */}
            {showToast && (
                <div className={`${styles.toast} ${showToast ? styles.showToast : ''}`}>
                    Copied!
                </div>
            )}
        </div>
    );
}
