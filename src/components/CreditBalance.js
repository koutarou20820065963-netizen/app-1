'use client';

import { useState, useEffect } from 'react';
import { CreditCard, X, ShoppingBag } from 'lucide-react';
import styles from './CreditBalance.module.css';

export default function CreditBalance() {
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchBalance = async () => {
        try {
            const res = await fetch('/api/credits');
            if (res.ok) {
                const data = await res.json();
                setBalance(data.balance);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
        // Poll every 30s to keep fresh? Or just on mount.
    }, []);

    const handlePurchase = async (pkgId) => {
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageId: pkgId })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Checkout failed');
            }
        } catch (e) {
            console.error(e);
            alert('Error starting checkout');
        }
    };

    if (loading) return null;

    return (
        <>
            <button className={styles.balanceBtn} onClick={() => setShowModal(true)}>
                <CreditCard size={16} />
                <span>{balance !== null ? `${balance} Cr` : '---'}</span>
            </button>

            {showModal && (
                <div className={styles.overlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Add Credits</h3>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <div className={styles.currentBalance}>
                            Current: <strong>{balance}</strong> Credits
                        </div>

                        <div className={styles.packages}>
                            <div className={styles.packageCard}>
                                <div className={styles.pkgIcon}><ShoppingBag size={24} /></div>
                                <div className={styles.pkgInfo}>
                                    <h4>Starter Pack</h4>
                                    <p>100 Credits</p>
                                </div>
                                <button className={styles.buyBtn} onClick={() => handlePurchase('small')}>
                                    $5
                                </button>
                            </div>
                            <div className={`${styles.packageCard} ${styles.popular}`}>
                                <div className={styles.pkgIcon}><ShoppingBag size={24} /></div>
                                <div className={styles.pkgInfo}>
                                    <h4>Value Pack</h4>
                                    <p>500 Credits</p>
                                </div>
                                <button className={styles.buyBtn} onClick={() => handlePurchase('medium')}>
                                    $20
                                </button>
                            </div>
                        </div>

                        <p className={styles.note}>
                            1 Credit = 1 Generation (Translate/Grade).
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
