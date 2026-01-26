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
    const [isFree, setIsFree] = useState(false);
    const [sortOrder, setSortOrder] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [reordering, setReordering] = useState(false);

    const fetchData = async () => {
        setLoading(true);

        // Fetch Categories
        const { data: catData } = await supabase.from("categories").select("*").order("sort_order");
        if (catData) setCategories(catData);

        // Fetch QA via API
        const res = await fetch('/api/admin/qa');
        const data = await res.json();
        if (data.data) {
            // Sort by sort_order then created_at
            const sorted = [...data.data].sort((a: QA, b: QA) => {
                if ((a.sort_order || 0) !== (b.sort_order || 0)) {
                    return (a.sort_order || 0) - (b.sort_order || 0);
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            setQaItems(sorted);
        }

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
                is_published: true,
                is_free: isFree,
                sort_order: sortOrder
            }),
        });

        const data = await res.json();

        if (data.error) {
            setErrorMessage(data.error);
            setShowError(true);
        } else {
            setTitle("");
            setQContent("");
            setAContent("");
            setCategoryId("");
            setIsFree(false);
            setSortOrder(0);
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
            setErrorMessage(data.error);
            setShowError(true);
        } else {
            fetchData();
        }
        setDeleteTarget(null);
    };

    const moveItem = async (id: string, direction: 'up' | 'down') => {
        const currentIndex = qaItems.findIndex(item => item.id === id);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= qaItems.length) return;

        setReordering(true);

        // Swap sort orders
        const currentItem = qaItems[currentIndex];
        const swapItem = qaItems[newIndex];

        // Update both items
        await Promise.all([
            fetch('/api/admin/qa', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: currentItem.id,
                    title: currentItem.question_title,
                    question: currentItem.question_content,
                    answer: currentItem.answer_content,
                    category_id: currentItem.category_id,
                    is_published: currentItem.is_published,
                    is_free: currentItem.is_free,
                    sort_order: newIndex
                }),
            }),
            fetch('/api/admin/qa', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: swapItem.id,
                    title: swapItem.question_title,
                    question: swapItem.question_content,
                    answer: swapItem.answer_content,
                    category_id: swapItem.category_id,
                    is_published: swapItem.is_published,
                    is_free: swapItem.is_free,
                    sort_order: currentIndex
                }),
            })
        ]);

        await fetchData();
        setReordering(false);
    };

    const togglePublish = async (qa: QA) => {
        const res = await fetch('/api/admin/qa', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: qa.id,
                title: qa.question_title,
                question: qa.question_content,
                answer: qa.answer_content,
                category_id: qa.category_id,
                is_published: !qa.is_published,
                is_free: qa.is_free,
                sort_order: qa.sort_order
            }),
        });
        const data = await res.json();
        if (!data.error) {
            fetchData();
        }
    };

    const getCategoryName = (id: string | null) => {
        if (!id) return "Uncategorized";
        const cat = categories.find(c => c.id === id);
        return cat ? cat.name : "Uncategorized";
    };

    return (
        <>
            {/* Legend - Top Right */}
            <div className="flex justify-end mb-4">
                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                    <span className="flex items-center gap-1">
                        <span className="text-emerald-600">⭕</span> 公開中
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                        <span className="text-red-500">❌</span> 非公開
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Panel - Title + Form (Sticky) */}
                <div className="xl:col-span-1 h-fit xl:sticky xl:top-4 space-y-4">
                    {/* Title */}
                    <h1 className="text-3xl font-bold text-foreground">Q&A 管理</h1>

                    {/* Create Form */}
                    <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
                            <span className="text-2xl">📝</span>
                            新規 Q&A 追加
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground-muted mb-1">カテゴリー</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                    required
                                >
                                    <option value="">カテゴリーを選択</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground-muted mb-1">タイトル (要約)</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2.5 text-foreground"
                                    required
                                    placeholder="質問の短い要約..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground-muted mb-1">質問詳細</label>
                                <textarea
                                    value={qContent}
                                    onChange={(e) => setQContent(e.target.value)}
                                    className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2.5 text-foreground"
                                    rows={3}
                                    required
                                    placeholder="質問の詳細..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground-muted mb-1">回答内容</label>
                                <textarea
                                    value={aContent}
                                    onChange={(e) => setAContent(e.target.value)}
                                    className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2.5 text-foreground"
                                    rows={4}
                                    required
                                    placeholder="専門家の回答..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground-muted mb-1">表示順序</label>
                                <input
                                    type="number"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                                    className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2.5 text-foreground"
                                    min="0"
                                    placeholder="0 = 最優先"
                                />
                                <p className="text-xs text-foreground-muted mt-1">数値が小さいほど上位に表示されます</p>
                            </div>

                            <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl border border-gray-300">
                                <input
                                    type="checkbox"
                                    id="isFree"
                                    checked={isFree}
                                    onChange={(e) => setIsFree(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="isFree" className="text-sm text-foreground-muted cursor-pointer select-none">
                                    🆓 無料公開 (Free Access)
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-indigo-900 text-white rounded-xl font-medium transition shadow-lg shadow-indigo-500/20"
                            >
                                Q&Aを公開
                            </button>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="xl:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-foreground">Q&A 一覧 ({qaItems.length}件)</h2>
                        {reordering && (
                            <span className="text-sm text-primary animate-pulse">並び替え中...</span>
                        )}
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {qaItems.map((qa, index) => (
                                <div key={qa.id} className={`relative bg-white p-5 rounded-xl border-2 transition-all group ${qa.is_published
                                    ? 'border-emerald-200 hover:border-emerald-300'
                                    : 'border-red-200 hover:border-red-300 opacity-75'
                                    }`}>
                                    {/* Order Controls */}
                                    <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col items-center justify-center gap-1 bg-surface-muted rounded-l-xl border-r border-border">
                                        <button
                                            onClick={() => moveItem(qa.id, 'up')}
                                            disabled={index === 0 || reordering}
                                            className="p-1.5 text-gray-400 hover:text-foreground hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                                            title="上に移動"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                            </svg>
                                        </button>
                                        <span className="text-xs font-mono text-foreground-muted w-6 text-center">{index + 1}</span>
                                        <button
                                            onClick={() => moveItem(qa.id, 'down')}
                                            disabled={index === qaItems.length - 1 || reordering}
                                            className="p-1.5 text-gray-400 hover:text-foreground hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                                            title="下に移動"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="ml-12 pl-4">
                                        {/* Top bar */}
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-indigo-50 text-primary uppercase tracking-wider">
                                                {getCategoryName(qa.category_id)}
                                            </span>
                                            {qa.is_free && (
                                                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                                                    🆓 FREE
                                                </span>
                                            )}

                                            {/* Status Toggle */}
                                            <button
                                                onClick={() => togglePublish(qa)}
                                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition ${qa.is_published
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                                    }`}
                                            >
                                                <span>{qa.is_published ? '⭕' : '❌'}</span>
                                                {qa.is_published ? '公開中' : '非公開'}
                                            </button>

                                            {/* Actions */}
                                            <div className="ml-auto flex gap-2">
                                                <Link
                                                    href={`/admin/qa/${qa.id}`}
                                                    className="text-primary hover:text-primary-hover text-sm font-medium px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
                                                >
                                                    編集
                                                </Link>
                                                <button
                                                    onClick={() => confirmDelete(qa.id)}
                                                    className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 transition"
                                                >
                                                    削除
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <Link href={`/admin/qa/${qa.id}`} className="block group/link">
                                            <h3 className="text-lg font-bold text-foreground group-hover/link:text-primary transition mb-1">
                                                {qa.question_title}
                                            </h3>
                                            <p className="text-sm text-foreground-muted line-clamp-2">{qa.question_content}</p>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {qaItems.length === 0 && (
                                <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                                    <div className="text-5xl mb-4">📭</div>
                                    <p className="text-foreground-muted italic">Q&Aがまだありません。</p>
                                    <p className="text-gray-400 text-sm mt-2">左のフォームから最初のQ&Aを作成しましょう</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
                        <h3 className="text-lg font-bold text-[#111111] mb-2">⚠️ 確認</h3>
                        <p className="text-[#444444] mb-6">
                            本当にこのQ&Aを削除しますか？<br />
                            <span className="text-xs text-gray-400">この操作は取り消せません。</span>
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 rounded-xl text-[#444444] hover:bg-gray-100 transition"
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-[#2563eb]/30 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2563eb] to-emerald-500"></div>
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">公開完了！</h3>
                        <p className="text-foreground-muted mb-6">
                            新しいQ&Aが公開されました。
                        </p>
                        <button
                            onClick={() => setShowSuccess(false)}
                            className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-full font-medium transition w-full"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showError && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-red-300 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-[#111111] mb-2">エラーが発生しました</h3>
                        <p className="text-[#444444] mb-6 text-sm">
                            {errorMessage}
                        </p>
                        <button
                            onClick={() => setShowError(false)}
                            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full font-medium transition w-full"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
