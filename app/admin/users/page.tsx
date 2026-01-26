'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    // Edit Modal State
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editEmail, setEditEmail] = useState('');
    const [editFullName, setEditFullName] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editIsAdmin, setEditIsAdmin] = useState(false);
    const [editLoading, setEditLoading] = useState(false);

    // Fetch Users on Mount
    const fetchUsers = async () => {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (data.data) {
            setUsers(data.data);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');

        try {
            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullName }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMsg(`エラー: ${data.error}`);
            } else {
                setMsg('ユーザーが正常に作成されました！');
                setEmail('');
                setPassword('');
                setFullName('');
                fetchUsers(); // Refresh list
            }
        } catch (err) {
            setMsg('リクエストに失敗しました');
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('本当にこのユーザーを削除しますか？')) return;

        const res = await fetch(`/api/admin/users?id=${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            setMsg('ユーザーを削除しました。');
            fetchUsers();
        } else {
            const data = await res.json();
            alert('削除エラー: ' + data.error);
        }
    };

    // Open Edit Modal
    const openEditModal = (user: any) => {
        setEditingUser(user);
        setEditEmail(user.email || '');
        setEditFullName(user.full_name || '');
        setEditIsAdmin(user.is_admin || false);
    };

    // Close Edit Modal
    const closeEditModal = () => {
        setEditingUser(null);
        setEditEmail('');
        setEditFullName('');
        setEditPassword('');
        setEditIsAdmin(false);
    };

    // Handle Edit Submit
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setEditLoading(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingUser.id,
                    email: editEmail,
                    full_name: editFullName,
                    password: editPassword || undefined,
                    is_admin: editIsAdmin,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert('更新エラー: ' + data.error);
            } else {
                setMsg('ユーザー情報を更新しました。');
                closeEditModal();
                fetchUsers();
            }
        } catch (err) {
            alert('リクエストに失敗しました');
        }
        setEditLoading(false);
    };

    return (
        <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Panel - Title + Form (Sticky) */}
                <div className="xl:col-span-1 h-fit xl:sticky xl:top-4 space-y-4">
                    {/* Title */}
                    <h1 className="text-3xl font-bold text-foreground">ユーザー管理</h1>

                    {/* Create User Form */}
                    <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 text-purple-600">新規ユーザー作成</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            {msg && (
                                <div className={`p-3 rounded text-sm ${msg.includes('エラー') || msg.includes('削除') ? 'bg-indigo-50 text-indigo-700' : 'bg-green-50 text-green-700'}`}>
                                    {msg}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-foreground-muted mb-1">メールアドレス</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-surface-muted border border-border rounded px-3 py-2 text-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground-muted mb-1">氏名</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-surface-muted border border-border rounded px-3 py-2 text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground-muted mb-1">パスワード</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-surface-muted border border-border rounded px-3 py-2 text-foreground"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition disabled:opacity-50"
                            >
                                {loading ? '作成中...' : 'ユーザーを作成'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="xl:col-span-2">
                    <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-surface-muted text-foreground-muted">
                                <tr>
                                    <th className="p-4">ユーザー (Email / Name)</th>
                                    <th className="p-4">権限</th>
                                    <th className="p-4">登録日</th>
                                    <th className="p-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-foreground-muted">
                                            ユーザーが見つかりません。
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-surface-muted transition">
                                            <td className="p-4">
                                                <div className="font-bold text-foreground">{user.email || 'No Email'}</div>
                                                <div className="text-sm text-foreground-muted">{user.full_name}</div>
                                                <div className="text-xs text-gray-400 font-mono mt-1">{user.id}</div>
                                            </td>
                                            <td className="p-4">
                                                {user.is_admin ? (
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-purple-50 text-purple-600 border border-purple-200">
                                                        ADMIN
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-surface-muted text-gray-500 border border-border">
                                                        USER
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-foreground-muted">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="text-primary hover:text-primary-hover text-sm font-medium hover:underline mr-4"
                                                >
                                                    編集
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-red-500 hover:text-red-600 text-sm font-medium hover:underline"
                                                >
                                                    削除
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-foreground">ユーザー編集</h2>
                            <button
                                onClick={closeEditModal}
                                className="text-gray-400 hover:text-foreground transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground-muted mb-1">メールアドレス</label>
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full bg-surface-muted border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-muted mb-1">氏名</label>
                                <input
                                    type="text"
                                    value={editFullName}
                                    onChange={(e) => setEditFullName(e.target.value)}
                                    className="w-full bg-surface-muted border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-muted mb-1">新しいパスワード</label>
                                <input
                                    type="password"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    className="w-full bg-surface-muted border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="変更する場合のみ入力"
                                    minLength={6}
                                />
                                <p className="text-xs text-foreground-muted mt-1">空欄の場合、パスワードは変更されません</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editIsAdmin}
                                        onChange={(e) => setEditIsAdmin(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                                <span className="text-sm font-medium text-foreground-muted">管理者権限</span>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-foreground rounded-lg font-medium transition"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition disabled:opacity-50"
                                >
                                    {editLoading ? '保存中...' : '保存'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
