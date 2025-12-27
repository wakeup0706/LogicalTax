'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types/database";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function QaDetail() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);

    // Data
    const [categories, setCategories] = useState<Category[]>([]);

    // Form State
    const [title, setTitle] = useState("");
    const [qContent, setQContent] = useState("");
    const [aContent, setAContent] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [isPublished, setIsPublished] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch Categories
            const { data: catData } = await supabase.from("categories").select("*").order("sort_order");
            if (catData) setCategories(catData);

            // 2. Fetch Q&A Item
            const res = await fetch(`/api/admin/qa?id=${id}`);
            const data = await res.json();
            const qa = data.data;

            if (qa) {
                setTitle(qa.question_title);
                setQContent(qa.question_content);
                setAContent(qa.answer_content);
                setCategoryId(qa.category_id || "");
                setIsPublished(qa.is_published);
            } else if (data.error || !qa) {
                alert("Q&Aが見つかりません");
                router.push("/admin/qa");
            }
            setLoading(false);
        };
        fetchData();
    }, [id, router]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        const res = await fetch('/api/admin/qa', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                title,
                question: qContent,
                answer: aContent,
                category_id: categoryId,
                is_published: isPublished
            }),
        });

        const data = await res.json();
        if (data.error) {
            alert("エラー: " + data.error);
        } else {
            setShowSuccess(true);
            setTimeout(() => {
                router.push("/admin/qa");
            }, 1500);
        }
    };

    const handleDelete = async () => {
        if (!confirm("本当にこのQ&Aを削除しますか？この操作は取り消せません。")) return;

        const res = await fetch(`/api/admin/qa?id=${id}`, {
            method: 'DELETE',
        });
        const data = await res.json();

        if (data.error) {
            alert("エラー: " + data.error);
        } else {
            router.push("/admin/qa");
        }
    };

    if (loading) return <div className="p-8 text-slate-400">読み込み中...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/qa" className="text-slate-400 hover:text-white transition">
                    ← 戻る
                </Link>
                <h1 className="text-3xl font-bold">Q&A 詳細編集</h1>
            </div>

            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                <form onSubmit={handleUpdate} className="space-y-6">
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
                        <label className="block text-sm font-medium text-slate-300 mb-1">タイトル (質問の要約)</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">質問詳細 (Question Details)</label>
                        <textarea
                            value={qContent}
                            onChange={(e) => setQContent(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none min-h-[150px]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">回答内容 (Answer Content)</label>
                        <textarea
                            value={aContent}
                            onChange={(e) => setAContent(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none min-h-[200px]"
                            required
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <input
                            type="checkbox"
                            id="publish"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 bg-slate-700"
                        />
                        <label htmlFor="publish" className="text-white font-medium cursor-pointer">
                            公開する (Published)
                        </label>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 rounded font-medium transition"
                        >
                            このQ&Aを削除
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold shadow-lg shadow-cyan-500/20 transition transform hover:translate-y-[-1px]"
                        >
                            変更を保存する
                        </button>
                    </div>
                </form>
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-800 border border-cyan-500/50 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                        <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">更新完了！</h3>
                        <p className="text-slate-300 mb-6">
                            Q&Aの内容が正常に更新されました。
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
