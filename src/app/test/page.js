'use client';

import { useState, useEffect } from 'react';
import { getMemos, updateMemo } from '../../lib/db';
import VoiceInput from '../../components/VoiceInput';
import styles from './page.module.css';
import { Play, CheckCircle, XCircle, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';

export default function TestPage() {
    // Stage: 'start', 'quiz', 'result', 'loading'
    const [stage, setStage] = useState('loading'); // loading -> start (if items) or empty
    const [dueMemos, setDueMemos] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null); // { score, bestFix, reasonJa }
    const [isGrading, setIsGrading] = useState(false);

    const loadDueMemos = async () => {
        setStage('loading');
        try {
            const allDone = await getMemos('done');
            const now = new Date();
            // Filter logic: In real app, check nextReviewAt.
            // For MVP: Just take random 3 from 'done'.
            const shuffled = allDone.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3);
            setDueMemos(selected);
            setStage(selected.length > 0 ? 'start' : 'empty');
        } catch (e) {
            console.error(e);
            setStage('empty');
        }
    };

    useEffect(() => {
        loadDueMemos();
    }, []);

    const startQuiz = () => {
        setStage('quiz');
        setCurrentIdx(0);
        setUserAnswer('');
        setFeedback(null);
    };

    const handleGrade = async () => {
        if (!userAnswer.trim()) return;
        setIsGrading(true);
        const currentMemo = dueMemos[currentIdx];

        try {
            const res = await fetch('/api/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetEn: currentMemo.aiCache.best,
                    userEn: userAnswer,
                    jpContext: currentMemo.jpText
                }),
            });
            const result = await res.json();
            setFeedback(result);

            // Update Review Stats (MVP: just rudimentary)
            // Ideally push to attempts array
            await updateMemo(currentMemo.id, {
                review: { lastReviewedAt: new Date().toISOString() } // simplified
            });

        } catch (e) {
            console.error(e);
            setFeedback({ score: 0, bestFix: "Error", reasonJa: "採点に失敗しました" });
        } finally {
            setIsGrading(false);
        }
    };

    const nextQuestion = () => {
        if (currentIdx < dueMemos.length - 1) {
            setCurrentIdx(currentIdx + 1);
            setUserAnswer('');
            setFeedback(null);
        } else {
            setStage('finished');
        }
    };

    const handleTranscript = (text) => {
        // Append with space if existing content
        setUserAnswer(prev => prev ? prev + ' ' + text : text);
    };

    if (stage === 'loading') return <div className={styles.container}><div className={styles.loading}>読み込み中...</div></div>;

    if (stage === 'empty' || stage === 'finished') {
        return (
            <main className={styles.container}>
                <h1 className={styles.title}>復習テスト</h1>
                <div className={styles.centerCard}>
                    {stage === 'empty' ? (
                        <>
                            <p>復習するメモがありません。</p>
                            <p className={styles.sub}>メモを完了するとここに出題されます。</p>
                        </>
                    ) : (
                        <>
                            <CheckCircle size={48} className={styles.successIcon} />
                            <h2>お疲れ様でした！</h2>
                            <p>今日の復習は完了です。</p>
                            <button className={styles.primaryButton} onClick={loadDueMemos}>
                                <RefreshCw size={18} /> もう一度 (デモ用)
                            </button>
                        </>
                    )}
                </div>
            </main>
        );
    }

    if (stage === 'start') {
        return (
            <main className={styles.container}>
                <h1 className={styles.title}>復習テスト</h1>
                <div className={styles.introCard}>
                    <p>復習待ちのメモ: <strong>{dueMemos.length}件</strong></p>
                    <p className={styles.sub}>英語で入力(または発音)して、定着度を確認しましょう。</p>
                    <button className={styles.startButton} onClick={startQuiz}>
                        <Play size={20} fill="currentColor" /> テストを開始 (3問)
                    </button>
                </div>
            </main>
        );
    }

    // Quiz View
    const currentMemo = dueMemos[currentIdx];

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <span>Question {currentIdx + 1} / {dueMemos.length}</span>
            </div>

            <div className={styles.questionCard}>
                <div className={styles.jpText}>{currentMemo.jpText}</div>

                {!feedback ? (
                    <div className={styles.inputArea}>
                        <div className={styles.inputTools}>
                            <VoiceInput onTranscript={handleTranscript} disabled={isGrading} />
                        </div>
                        <textarea
                            className={styles.textarea}
                            placeholder="英語で入力..."
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            rows={3}
                        />
                        <button
                            className={styles.gradeButton}
                            onClick={handleGrade}
                            disabled={isGrading || !userAnswer.trim()}
                        >
                            {isGrading ? <Loader2 className={styles.spin} /> : '採点する'}
                        </button>
                    </div>
                ) : (
                    <div className={styles.feedbackArea}>
                        <div className={`${styles.scoreBadge} ${feedback.score >= 80 ? styles.good : styles.bad}`}>
                            {feedback.score >= 80 ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            <span>Score: {feedback.score}</span>
                        </div>

                        <div className={styles.feedbackContent}>
                            <p className={styles.reason}>{feedback.reasonJa}</p>
                            <div className={styles.fixBox}>
                                <div className={styles.fixLabel}>改善案 / 正解</div>
                                <div className={styles.fixText}>{feedback.bestFix}</div>
                            </div>
                        </div>

                        <button className={styles.nextButton} onClick={nextQuestion}>
                            次へ <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
