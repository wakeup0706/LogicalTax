'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsers() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

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
            }
        } catch (err) {
            setMsg('リクエストに失敗しました');
        }
        setLoading(false);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">ユーザー管理</h1>

            <div className="max-w-md bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h2 className="text-xl font-semibold mb-4 text-purple-400">新規ユーザー作成</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    {msg && (
                        <div className={`p-3 rounded text-sm ${msg.includes('エラー') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
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
    );
}
