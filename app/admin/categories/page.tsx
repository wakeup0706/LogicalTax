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
    const [sortOrder, setSortOrder] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [reordering, setReordering] = useState(false);

    const fetchCategories = async () => {
        const { data } = await supabase
            .from("categories")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true });
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
            body: JSON.stringify({ name, slug, description: desc, sort_order: sortOrder }),
        });

        const data = await res.json();

        if (data.error) {
            alert("エラー: " + data.error);
        } else {
            setName("");
            setSlug("");
            setDesc("");
            setSortOrder(0);
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

    const moveCategory = async (id: string, direction: 'up' | 'down') => {
        const currentIndex = categories.findIndex(c => c.id === id);
        if (currentIndex === -1) return;
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= categories.length) return;

        setReordering(true);

        const currentCat = categories[currentIndex];
        const swapCat = categories[newIndex];

        // Update both categories
        await Promise.all([
            fetch('/api/admin/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: currentCat.id,
                    name: currentCat.name,
                    slug: currentCat.slug,
                    description: currentCat.description,
                    sort_order: newIndex
                }),
            }),
            fetch('/api/admin/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: swapCat.id,
                    name: swapCat.name,
                    slug: swapCat.slug,
                    description: swapCat.description,
                    sort_order: currentIndex
                }),
            })
        ]);

        await fetchCategories();
        setReordering(false);
    };

    return (
        <>
            {/* Reordering indicator - Top Right */}
            {reordering && (
                <div className="flex justify-end mb-4">
                    <span className="text-sm text-cyan-400 animate-pulse">並び替え中...</span>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Panel - Title + Form (Sticky) */}
                <div className="xl:col-span-1 h-fit xl:sticky xl:top-4 space-y-4">
                    {/* Title */}
                    <h1 className="text-3xl font-bold">カテゴリー管理</h1>
                    
                    {/* Create Form */}
                    <div className="p-6 rounded-2xl border border-slate-700 bg-slate-800/50">
                        <h2 className="text-xl font-semibold mb-4 text-cyan-400 flex items-center gap-2">
                            <span className="text-2xl">📁</span>
                            新規カテゴリー追加
                        </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">カテゴリー名</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white"
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
                                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white font-mono text-sm"
                                required
                                placeholder="例: tax-advice"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">表示順序</label>
                            <input
                                type="number"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white"
                                min="0"
                                placeholder="0 = 最優先"
                            />
                            <p className="text-xs text-slate-500 mt-1">数値が小さいほど上位に表示されます</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">説明</label>
                            <textarea
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white"
                                rows={3}
                                placeholder="カテゴリーの簡単な説明..."
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-medium transition shadow-lg shadow-indigo-500/20"
                        >
                            カテゴリーを作成
                        </button>
                    </form>
                    </div>
                </div>

                {/* List */}
                <div className="xl:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-white">既存のカテゴリー ({categories.length}件)</h2>
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {categories.map((cat, index) => {
                                const icons = ['💰', '📊', '🏢', '📝', '⚖️', '💼', '📈', '🔍'];
                                return (
                                    <div key={cat.id} className="relative bg-slate-800/50 p-5 rounded-xl border-2 border-slate-700/50 hover:border-cyan-500/30 transition-all group">
                                        {/* Order Controls */}
                                        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col items-center justify-center gap-1 bg-slate-900/50 rounded-l-xl border-r border-slate-700/50">
                                            <button
                                                onClick={() => moveCategory(cat.id, 'up')}
                                                disabled={index === 0 || reordering}
                                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                                                title="上に移動"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                                </svg>
                                            </button>
                                            <span className="text-xs font-mono text-slate-500 w-6 text-center">{index + 1}</span>
                                            <button
                                                onClick={() => moveCategory(cat.id, 'down')}
                                                disabled={index === categories.length - 1 || reordering}
                                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                                                title="下に移動"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="ml-12 pl-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <Link href={`/admin/categories/${cat.slug}`} className="flex-1 block">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-2xl">{icons[index % icons.length]}</span>
                                                    <h3 className="font-bold text-white text-lg group-hover:text-cyan-400 transition">{cat.name}</h3>
                                                    <span className="text-xs bg-slate-900/80 text-slate-500 px-2 py-0.5 rounded-full font-mono">/{cat.slug}</span>
                                                </div>
                                                {cat.description && (
                                                    <p className="text-sm text-slate-400 line-clamp-2 ml-9">{cat.description}</p>
                                                )}
                                            </Link>
                                            <div className="flex gap-2 ml-9 sm:ml-0">
                                                <Link
                                                    href={`/admin/categories/${cat.slug}`}
                                                    className="text-cyan-400 hover:text-cyan-300 text-sm font-medium px-3 py-1.5 rounded-lg bg-cyan-900/20 hover:bg-cyan-900/30 border border-cyan-900/30 transition"
                                                >
                                                    編集
                                                </Link>
                                                <button
                                                    onClick={() => confirmDelete(cat.id)}
                                                    className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/30 border border-red-900/30 transition"
                                                >
                                                    削除
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {categories.length === 0 && (
                                <div className="p-12 text-center border-2 border-dashed border-slate-700 rounded-2xl">
                                    <div className="text-5xl mb-4">📂</div>
                                    <p className="text-slate-500 italic">カテゴリーがまだありません。</p>
                                    <p className="text-slate-600 text-sm mt-2">左のフォームから最初のカテゴリーを作成しましょう</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
                        <h3 className="text-lg font-bold text-white mb-2">⚠️ 確認</h3>
                        <p className="text-slate-300 mb-6">
                            本当にこのカテゴリーを削除しますか？<br />
                            <span className="text-xs text-slate-500">この操作は取り消せません。</span>
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-700 transition"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={executeDelete}
                                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition"
                            >
                                削除する
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-800 border border-cyan-500/50 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-emerald-500"></div>
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
        </>
    );
}
