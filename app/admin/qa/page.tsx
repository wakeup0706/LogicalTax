'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Category, QA } from "@/types/database";
import Link from "next/link";

export default function AdminQA() {
    const [qaItems, setQaItems] = useState<QA[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Form State
    const [title, setTitle] = useState("");
    const [qContent, setQContent] = useState("");
    const [aContent, setAContent] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);

        // Fetch Categories
        const { data: catData } = await supabase.from("categories").select("*").order("sort_order");
        if (catData) setCategories(catData);

        // Fetch QA - now via API to bypass any RLS issues just in case, or using a public view if policy allows.
        // For admin list, let's stick to the secure API route we made for consistency?
        // Actually the API route supports GET now. Let's use the API for guaranteed access.
        const res = await fetch('/api/admin/qa');
        const data = await res.json();
        if (data.data) setQaItems(data.data);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !qContent || !aContent || !categoryId) return;

        const res = await fetch('/api/admin/qa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                question: qContent,
                answer: aContent,
                category_id: categoryId,
                is_published: true // Default to published
            }),
        });

        const data = await res.json();

        if (data.error) {
            alert("エラー: " + data.error);
        } else {
            setTitle("");
            setQContent("");
            setAContent("");
            setCategoryId("");
            fetchData();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    const confirmDelete = (id: string) => {
        setDeleteTarget(id);
    };

    const executeDelete = async () => {
        if (!deleteTarget) return;
        const res = await fetch(`/api/admin/qa?id=${deleteTarget}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.error) {
            alert("エラー: " + data.error);
        } else {
            fetchData();
        }
        setDeleteTarget(null);
    };

    const getCategoryName = (id: string | null) => {
        if (!id) return "Uncategorized";
        const cat = categories.find(c => c.id === id);
        return cat ? cat.name : "Uncategorized";
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Q&A 管理 (Q&A Management)</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="lg:col-span-1 p-6 rounded-xl border border-slate-700 bg-slate-800 h-fit">
                    <h2 className="text-xl font-semibold mb-4 text-cyan-400">
                        新規 Q&A 追加
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">カテゴリー</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                required
                            >
                                <option value="">カテゴリーを選択</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">タイトル (要約)</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                                required
                                placeholder="質問の短い要約..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">質問詳細</label>
                            <textarea
                                value={qContent}
                                onChange={(e) => setQContent(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                                rows={3}
                                required
                                placeholder="質問の詳細..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">回答内容</label>
                            <textarea
                                value={aContent}
                                onChange={(e) => setAContent(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                                rows={4}
                                required
                                placeholder="専門家の回答..."
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition"
                        >
                            Q&Aを公開
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-white">最新の Q&A</h2>
                    {loading ? (
                        <p className="text-slate-400">読み込み中...</p>
                    ) : (
                        <div className="space-y-4">
                            {qaItems.map((qa) => (
                                <div key={qa.id} className="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-slate-600 transition group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-900 text-indigo-300 uppercase tracking-wider">
                                            {getCategoryName(qa.category_id)}
                                        </span>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/admin/qa/${qa.id}`}
                                                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                                            >
                                                編集 (Edit)
                                            </Link>
                                            <button
                                                onClick={() => confirmDelete(qa.id)}
                                                className="text-red-400 hover:text-red-300 text-sm font-medium ml-2"
                                            >
                                                削除 (Delete)
                                            </button>
                                        </div>
                                    </div>
                                    <Link href={`/admin/qa/${qa.id}`} className="block group-hover:bg-slate-700/30 -mx-5 -mb-5 px-5 pb-5 pt-2 rounded-b-lg transition">
                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition">{qa.question_title}</h3>
                                        <p className="text-sm text-slate-400 line-clamp-2">{qa.question_content}</p>
                                    </Link>
                                </div>
                            ))}
                            {qaItems.length === 0 && (
                                <div className="p-8 text-center border-2 border-dashed border-slate-700 rounded-xl">
                                    <p className="text-slate-500 italic">Q&Aがまだありません。</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-sm w-full">
                        <h3 className="text-lg font-bold text-white mb-2">確認</h3>
                        <p className="text-slate-300 mb-6">
                            本当にこのQ&Aを削除しますか？<br />
                            <span className="text-xs text-slate-500">この操作は取り消せません。</span>
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 rounded text-slate-300 hover:bg-slate-700 transition"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={executeDelete}
                                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-medium transition"
                            >
                                削除する
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-800 border border-cyan-500/50 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                        <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">公開完了！</h3>
                        <p className="text-slate-300 mb-6">
                            新しいQ&Aが公開されました。
                        </p>
                        <button
                            onClick={() => setShowSuccess(false)}
                            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-medium transition w-full"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
