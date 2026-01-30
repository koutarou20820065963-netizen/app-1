'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { Mic, CheckCircle, XCircle, ArrowRight, RefreshCw, Play, StopCircle } from 'lucide-react';

export default function TestPage() {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [grading, setGrading] = useState(false);
    const [listening, setListening] = useState(false);

    // Voice recognition ref
    const recognition = useRef(null);
    // Prevent double fetch in strict mode
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            loadQuestions();
        }

        // Init SpeechRecognition
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognition.current = new SpeechRecognition();
                recognition.current.lang = 'en-US';
                recognition.current.continuous = false;
                recognition.current.interimResults = false;

                recognition.current.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    if (questions.length > 0) {
                        setAnswers(prev => ({
                            ...prev,
                            // Use functional index check or just ensure safe access
                            [questions[currentIndex]?.id]: transcript
                        }));
                    }
                    setListening(false);
                };

                recognition.current.onerror = (e) => {
                    console.error(e);
                    setListening(false);
                };

                recognition.current.onend = () => setListening(false);
            }
        }
    }, [questions.length, currentIndex]); // Careful with deps. Questions length changes only once.

    const loadQuestions = async () => {
        setLoading(true);
        try {
            // Fetch local unprocessed memos
            // We need to dynamic import or use the imported getMemos
            const { getMemos } = await import('../../lib/db');
            const unprocessed = await getMemos('unprocessed');

            if (unprocessed.length === 0) {
                setQuestions([]);
                return;
            }

            const res = await fetch('/api/test/generate', {
                method: 'POST',
                body: JSON.stringify({
                    mode: 'custom',
                    sources: unprocessed
                })
            });
            const data = await res.json();
            if (data.questions && data.questions.length > 0) {
                setQuestions(data.questions);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (e) => {
        setAnswers({ ...answers, [questions[currentIndex].id]: e.target.value });
    };

    const startListening = () => {
        if (recognition.current) {
            setListening(true);
            recognition.current.start();
        } else {
            alert("Voice input not supported in this browser.");
        }
    };

    const stopListening = () => {
        if (recognition.current) {
            recognition.current.stop();
            setListening(false);
        }
    };

    const submitAnswer = async () => {
        const q = questions[currentIndex];
        const userAns = answers[q.id];

        if (!userAns) return;

        setGrading(true);
        try {
            // Include memoId for auto-complete logic
            const res = await fetch('/api/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: q.text,
                    userAnswer: userAns,
                    correctAnswer: q.answer,
                    memoId: q.memoId,
                    currentLevel: q.level || 0 // Pass current SRS level
                }),
            });
            const result = await res.json();
            setResults({ ...results, [q.id]: result });

            // Client-side Update (SRS)
            if (q.memoId && result.srs) {
                const { updateMemo } = await import('../../lib/db');
                const updates = {
                    review: {
                        level: result.srs.level,
                        interval: result.srs.interval,
                        nextReviewAt: result.srs.nextReviewAt
                    }
                };

                // If graduated, mark done
                if (result.srs.markAsDone) {
                    updates.status = 'done';
                }

                await updateMemo(q.memoId, updates);
            }

        } catch (e) {
            console.error(e);
            alert("Grading failed");
        } finally {
            setGrading(false);
        }
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const isPass = (score) => score >= 80;

    if (loading) return <div className={styles.loadingContainer}><div className={styles.spinner}></div><p>Loading Test...</p></div>;
    if (questions.length === 0) return <div className={styles.container}><p>No questions available. Translate some memos first!</p></div>;

    const currentQ = questions[currentIndex];
    const currentResult = results[currentQ.id];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Review Test</h1>
                <span className={styles.progress}>Q {currentIndex + 1} / {questions.length}</span>
            </header>

            <div className={styles.card}>
                <div className={styles.questionType}>{currentQ.type}</div>
                <h2 className={styles.questionText}>{currentQ.text}</h2>
                {currentQ.hint && <p className={styles.hint}>Hint: {currentQ.hint}</p>}

                <div className={styles.inputArea}>
                    <textarea
                        className={styles.textarea}
                        value={answers[currentQ.id] || ''}
                        onChange={handleAnswerChange}
                        placeholder="Type answer or speak..."
                        disabled={!!currentResult}
                    />
                    <button
                        className={`${styles.micBtn} ${listening ? styles.listening : ''}`}
                        onClick={listening ? stopListening : startListening}
                        disabled={!!currentResult}
                        title="Voice Input"
                    >
                        {listening ? <StopCircle size={24} /> : <Mic size={24} />}
                    </button>
                </div>

                {!currentResult ? (
                    <div className={styles.actionRow}>
                        <button
                            className={styles.submitBtn}
                            onClick={submitAnswer}
                            disabled={!answers[currentQ.id] || grading}
                        >
                            {grading ? 'Converting...' : 'Submit'}
                        </button>
                    </div>
                ) : (
                    <div className={styles.resultArea}>
                        <div className={`${styles.scoreBadge} ${isPass(currentResult.score) ? styles.pass : styles.fail}`}>
                            {isPass(currentResult.score) ? <CheckCircle size={24} /> : <XCircle size={24} />}
                            <span className={styles.scoreNum}>{currentResult.score}</span>
                        </div>
                        <p className={styles.comment}>{currentResult.reasonJa}</p>

                        {isPass(currentResult.score) && (
                            <div className={styles.autoDoneMsg}>
                                <CheckCircle size={14} /> Completed! Moved to Archive.
                            </div>
                        )}

                        {currentResult.bestFix && (
                            <div className={styles.fixBox}>
                                <strong>Model Answer:</strong> {currentResult.bestFix}
                            </div>
                        )}
                        <div className={styles.navBtns}>
                            {currentIndex < questions.length - 1 ? (
                                <button className={styles.nextBtn} onClick={nextQuestion}>
                                    Next Question <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button className={styles.finishBtn} onClick={() => alert("Test Completed!")}>
                                    Finish Test
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
