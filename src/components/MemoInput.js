'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { addMemo } from '../lib/db';
import styles from './MemoInput.module.css';

export default function MemoInput({ onSave }) {
    const [text, setText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef(null);

    useEffect(() => {
        // Immediate Auto-focus on mount
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    const handleSave = async () => {
        if (!text.trim()) return;

        setIsSaving(true);
        try {
            const newMemo = await addMemo(text.trim());
            setText('');
            if (onSave) onSave(newMemo);

            // Keep focus for continuous entry
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        } catch (e) {
            console.error('Failed to save memo', e);
            alert('保存に失敗しました。');
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        // CMD/CTRL + Enter to save
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <div className={styles.wrapper}>
            <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="言えなかったことを入力..."
                disabled={isSaving}
            />
            <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={!text.trim() || isSaving}
                aria-label="保存"
            >
                {isSaving ? <Loader2 className={styles.spin} size={24} /> : <Send size={24} />}
            </button>
        </div>
    );
}
