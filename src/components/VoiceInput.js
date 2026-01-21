'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, AlertCircle } from 'lucide-react';
import styles from './VoiceInput.module.css';

export default function VoiceInput({ onTranscript, disabled }) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.interimResults = true;
                recognition.continuous = true;

                recognition.onresult = (event) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            // Optionally handle interim
                        }
                    }
                    if (finalTranscript) {
                        onTranscript(finalTranscript);
                    }
                };

                recognition.onerror = (event) => {
                    console.error('Speech recognition error', event.error);
                    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                        setIsSupported(false);
                    }
                    setIsListening(false);
                };

                recognition.onend = () => {
                    // If purely stopped by user, state handles it. 
                    // If stopped by silence, we might want to update state
                    if (isListening) {
                        // Automatically stopped (maybe silence), but we want explicit stop?
                        // Actually, standard behavior is stop on end.
                        setIsListening(false);
                    }
                };

                recognition.onstart = () => {
                    setIsListening(true);
                }

                recognitionRef.current = recognition;
            } else {
                setIsSupported(false);
            }
        }
    }, [onTranscript, isListening]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                // State update happens in onstart
            } catch (e) {
                console.error(e);
                setIsListening(false);
            }
        }
    };

    if (!isSupported) {
        return (
            <div className={styles.unsupported}>
                <span className={styles.warningIcon}><AlertCircle size={14} /></span>
                <span className={styles.warningText}>音声入力非対応 (Text Only)</span>
            </div>
        );
    }

    return (
        <button
            className={`${styles.button} ${isListening ? styles.listening : ''}`}
            onClick={toggleListening}
            disabled={disabled}
            type="button"
            aria-label={isListening ? "音声入力を停止" : "音声入力を開始"}
        >
            {isListening ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
            <span className={styles.label}>{isListening ? '停止' : '音声入力'}</span>
        </button>
    );
}
