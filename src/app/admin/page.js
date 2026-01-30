'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, CreditCard, Search } from 'lucide-react';
import styles from './page.module.css';

export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const adjustCredits = async (amount) => {
        if (!selectedUser) return;
        try {
            const res = await fetch('/api/admin/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUser.id, amount })
            });
            if (res.ok) {
                // Refresh
                fetchUsers();
                setSelectedUser(prev => ({ ...prev, credits: prev.credits + amount }));
            }
        } catch (e) {
            alert('Failed to update credits');
        }
    };

    if (loading) return <div className={styles.container}>Loading Admin...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.brand}>
                    <Shield size={24} />
                    <h1>Admin Dashboard</h1>
                </div>
                <div className={styles.status}>Live Data</div>
            </header>

            <div className={styles.grid}>
                {/* User List */}
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Users size={20} />
                        <h2>Users</h2>
                    </div>
                    <div className={styles.list}>
                        {users.map(u => (
                            <div
                                key={u.id}
                                className={`${styles.item} ${selectedUser?.id === u.id ? styles.selected : ''}`}
                                onClick={() => setSelectedUser(u)}
                            >
                                <div className={styles.uInfo}>
                                    <div className={styles.uEmail}>{u.email}</div>
                                    <div className={styles.uMeta}>ID: {u.id.substring(0, 8)}...</div>
                                </div>
                                <div className={styles.uCredits}>{u.credits} Cr</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* User Detail & Actions */}
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <CreditCard size={20} />
                        <h2>Manage Credits</h2>
                    </div>
                    {selectedUser ? (
                        <div className={styles.detail}>
                            <h3>{selectedUser.email}</h3>
                            <div className={styles.stats}>
                                <div className={styles.statBox}>
                                    <label>Credits</label>
                                    <span>{selectedUser.credits}</span>
                                </div>
                                <div className={styles.statBox}>
                                    <label>Role</label>
                                    <span>{selectedUser.role}</span>
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <label>Add Credits</label>
                                <div className={styles.btnRow}>
                                    <button onClick={() => adjustCredits(100)}>+100</button>
                                    <button onClick={() => adjustCredits(500)}>+500</button>
                                    <button className={styles.btnDanger} onClick={() => adjustCredits(-100)}>-100</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className={styles.empty}>Select a user to manage.</p>
                    )}
                </section>
            </div>
        </div>
    );
}
