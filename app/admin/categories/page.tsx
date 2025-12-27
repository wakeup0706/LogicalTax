'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types/database";
import Link from "next/link";

export default function AdminCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Form State
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [desc, setDesc] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const fetchCategories = async () => {
        const { data } = await supabase
            .from("categories")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true });  // Secondary sort by name for consistent ordering
        if (data) setCategories(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !slug) return;

        const res = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, slug, description: desc }),
        });

        const data = await res.json();

        if (data.error) {
            alert("エラー: " + data.error);
        } else {
            setName("");
            setSlug("");
            setDesc("");
            fetchCategories();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    const confirmDelete = (id: string) => {
        setDeleteTarget(id);
    };

    const executeDelete = async () => {
        if (!deleteTarget) return;

        const res = await fetch(`/api/admin/categories?id=${deleteTarget}`, {
            method: 'DELETE',
        });
        const data = await res.json();

        if (data.error) {
            alert("エラー: " + data.error);
        } else {
            fetchCategories();
        }
        setDeleteTarget(null);
    };

    // Convert name to slug automatically
    const handleNameChange = (val: string) => {
        setName(val);
        setSlug(val.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""));
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">カテゴリー管理</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="lg:col-span-1 p-6 rounded-xl border border-slate-700 bg-slate-800 h-fit">
                    <h2 className="text-xl font-semibold mb-4 text-cyan-400">
                        新規カテゴリー追加
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">カテゴリー名</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                                required
                                placeholder="例: 税務相談"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">スラッグ (Slug)</label>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                                required
                                placeholder="例: tax-advice"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">説明</label>
                            <textarea
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                                rows={3}
                                placeholder="カテゴリーの簡単な説明..."
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition"
                        >
                            カテゴリーを作成
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-white">既存のカテゴリー</h2>
                    {loading ? (
                        <p className="text-slate-400">読み込み中...</p>
                    ) : (
                        <div className="space-y-3">
                            {categories.map((cat) => (
                                <div key={cat.id} className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex justify-between items-start group hover:border-slate-600 transition">
                                    <Link href={`/admin/categories/${cat.slug}`} className="flex-1 block mr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-white text-lg group-hover:text-cyan-400 transition">{cat.name}</p>
                                            <span className="text-xs bg-slate-900 text-slate-500 px-2 py-0.5 rounded-full font-mono">/{cat.slug}</span>
                                        </div>
                                        {cat.description && (
                                            <p className="text-sm text-slate-400 line-clamp-2">{cat.description}</p>
                                        )}
                                    </Link>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/admin/categories/${cat.slug}`}
                                            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium px-3 py-1.5 rounded bg-cyan-900/10 hover:bg-cyan-900/20 border border-cyan-900/30 transition"
                                        >
                                            編集
                                        </Link>
                                        <button
                                            onClick={() => confirmDelete(cat.id)}
                                            className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1.5 rounded bg-red-900/10 hover:bg-red-900/20 border border-red-900/30 transition"
                                        >
                                            削除
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {categories.length === 0 && (
                                <div className="p-8 text-center border-2 border-dashed border-slate-700 rounded-xl">
                                    <p className="text-slate-500 italic">カテゴリーがまだありません。</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Delete Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-sm w-full">
                        <h3 className="text-lg font-bold text-white mb-2">確認</h3>
                        <p className="text-slate-300 mb-6">
                            本当にこのカテゴリーを削除しますか？<br />
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
                        <h3 className="text-2xl font-bold text-white mb-2">作成完了！</h3>
                        <p className="text-slate-300 mb-6">
                            新しいカテゴリーが正常に作成されました。
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

