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
    const [isFree, setIsFree] = useState(false);
    const [sortOrder, setSortOrder] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

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
                setIsFree(qa.is_free || false);
                setSortOrder(qa.sort_order || 0);
            } else if (data.error || !qa) {
                setErrorMessage("Q&Aが見つかりません");
                setShowError(true);
                setTimeout(() => router.push("/admin/qa"), 2000);
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
                is_published: isPublished,
                is_free: isFree,
                sort_order: sortOrder
            }),
        });

        const data = await res.json();
        if (data.error) {
            setErrorMessage(data.error);
            setShowError(true);
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
            setErrorMessage(data.error);
            setShowError(true);
        } else {
            router.push("/admin/qa");
        }
    };

    if (loading) return <div className="p-8 text-[#444444]">読み込み中...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/qa" className="text-[#444444] hover:text-[#111111] transition">
                    ← 戻る
                </Link>
                <h1 className="text-3xl font-bold text-[#111111]">Q&A 詳細編集</h1>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[#444444] mb-1">カテゴリー</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-[#111111] focus:ring-2 focus:ring-[#2563eb] outline-none"
                            required
                        >
                            <option value="">カテゴリーを選択</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#444444] mb-1">タイトル (質問の要約)</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-[#111111] focus:ring-2 focus:ring-[#2563eb] outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#444444] mb-1">質問詳細 (Question Details)</label>
                        <textarea
                            value={qContent}
                            onChange={(e) => setQContent(e.target.value)}
                            className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-[#111111] focus:ring-2 focus:ring-[#2563eb] outline-none min-h-[150px]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#444444] mb-1">回答内容 (Answer Content)</label>
                        <textarea
                            value={aContent}
                            onChange={(e) => setAContent(e.target.value)}
                            className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-[#111111] focus:ring-2 focus:ring-[#2563eb] outline-none min-h-[200px]"
                            required
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-gray-100 p-4 rounded-lg border border-gray-300">
                        <input
                            type="checkbox"
                            id="publish"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]"
                        />
                        <label htmlFor="publish" className="text-[#111111] font-medium cursor-pointer">
                            公開する (Published)
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#444444] mb-1">表示順序</label>
                        <input
                            type="number"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                            className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-[#111111] focus:ring-2 focus:ring-[#2563eb] outline-none"
                            min="0"
                        />
                        <p className="text-xs text-[#444444] mt-1">数値が小さいほど上位に表示されます</p>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-100 p-4 rounded-lg border border-gray-300">
                        <input
                            type="checkbox"
                            id="isFree"
                            checked={isFree}
                            onChange={(e) => setIsFree(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]"
                        />
                        <label htmlFor="isFree" className="text-[#111111] font-medium cursor-pointer">
                            🆓 無料公開 (Free Access)
                        </label>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded font-medium transition"
                        >
                            このQ&Aを削除
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-[#2563eb] hover:bg-[#1e40af] text-white rounded font-bold shadow-lg shadow-indigo-500/20 transition transform hover:translate-y-[-1px]"
                        >
                            変更を保存する
                        </button>
                    </div>
                </form>
            </div >

            {/* Success Modal */}
            {
                showSuccess && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white border border-[#2563eb]/30 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2563eb] to-blue-500"></div>
                            <div className="w-16 h-16 bg-[#2563eb]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#2563eb]">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-[#111111] mb-2">更新完了！</h3>
                            <p className="text-[#444444] mb-6">
                                Q&Aの内容が正常に更新されました。
                            </p>
                            <button
                                onClick={() => setShowSuccess(false)}
                                className="px-6 py-2 bg-[#2563eb] hover:bg-[#1e40af] text-white rounded-full font-medium transition w-full"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Error Modal */}
            {showError && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-red-300 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
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
        </div >
    );
}
