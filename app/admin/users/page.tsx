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

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">ユーザー管理</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Create User Form */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 sticky top-4">
                        <h2 className="text-xl font-semibold mb-4 text-purple-400">新規ユーザー作成</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            {msg && (
                                <div className={`p-3 rounded text-sm ${msg.includes('エラー') || msg.includes('削除') ? 'bg-indigo-500/20 text-indigo-200' : 'bg-green-500/20 text-green-300'}`}>
                                    {msg}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">メールアドレス</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">氏名</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">パスワード</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
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

                {/* User List Table */}
                <div className="w-full lg:w-2/3">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-700/50 text-slate-300">
                                <tr>
                                    <th className="p-4">ユーザー (Email / Name)</th>
                                    <th className="p-4">権限</th>
                                    <th className="p-4">登録日</th>
                                    <th className="p-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500">
                                            ユーザーが見つかりません。
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-700/30 transition">
                                            <td className="p-4">
                                                <div className="font-bold text-white">{user.email || 'No Email'}</div>
                                                <div className="text-sm text-slate-400">{user.full_name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-1">{user.id}</div>
                                            </td>
                                            <td className="p-4">
                                                {user.is_admin ? (
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                        ADMIN
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-slate-600/20 text-slate-400 border border-slate-600/30">
                                                        USER
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-slate-400">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-red-400 hover:text-red-300 text-sm font-medium hover:underline"
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
        </div>
    );
}
