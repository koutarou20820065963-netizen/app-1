'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Mic } from 'lucide-react';
import { addMemo } from '../lib/db';
import styles from './MemoInput.module.css';

export default function MemoInput({ onSubmit, disabled }) {
    const [text, setText] = useState('');
    const textareaRef = useRef(null);

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
        }
    }, [text]);

    const handleSend = () => {
        if (!text.trim() || disabled) return;
        onSubmit(text.trim());
        setText('');
        // Reset height
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.container}>
            <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="言えなかった日本語を入力 (例: 進捗どう？)"
                disabled={disabled}
                rows={1}
            />

            <div className={styles.actions}>
                <button className={styles.micButton} title="Voice Input (Coming Soon)">
                    <Mic size={20} />
                </button>

                <button
                    className={styles.sendButton}
                    onClick={handleSend}
                    disabled={!text.trim() || disabled}
                >
                    {disabled ? <Loader2 className={styles.spin} size={18} /> : <Send size={18} />}
                </button>
            </div>
        </div>
    );
}
