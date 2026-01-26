'use client';

import { useState, useEffect } from "react";
import { Category } from "@/types/database";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function CategoryDetail() {
    const router = useRouter();
    const params = useParams<{ slug: string }>();
    const categorySlug = params.slug;
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<Category | null>(null);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [desc, setDesc] = useState("");
    const [sortOrder, setSortOrder] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchCategory = async () => {
            if (!categorySlug) return;
            try {
                const res = await fetch(`/api/admin/categories?slug=${categorySlug}`);
                const result = await res.json();

                if (result.error) {
                    alert("カテゴリーが見つかりません");
                    router.push("/admin/categories");
                    return;
                }

                if (result.data) {
                    setCategory(result.data);
                    setName(result.data.name);
                    setSlug(result.data.slug);
                    setDesc(result.data.description || "");
                    setSortOrder(result.data.sort_order || 0);
                }
            } catch (error) {
                alert("カテゴリーが見つかりません");
                router.push("/admin/categories");
            }
            setLoading(false);
        };
        fetchCategory();
    }, [categorySlug, router]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category) return;

        setSaving(true);
        const res = await fetch('/api/admin/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: category.id, name, slug, description: desc, sort_order: sortOrder }),
        });

        const data = await res.json();
        setSaving(false);

        if (data.error) {
            alert("エラー: " + data.error);
        } else {
            // Redirect back to categories list after successful save
            router.push("/admin/categories");
        }
    };

    const handleDelete = async () => {
        if (!category) return;
        if (!confirm("本当にこのカテゴリーを削除しますか？この操作は取り消せません。")) return;

        const res = await fetch(`/api/admin/categories?id=${category.id}`, {
            method: 'DELETE',
        });
        const data = await res.json();

        if (data.error) {
            alert("エラー: " + data.error);
        } else {
            router.push("/admin/categories");
        }
    };

    if (loading) return <div className="p-8 text-foreground-muted">読み込み中...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/categories" className="text-foreground-muted hover:text-foreground transition">
                    ← 戻る
                </Link>
                <h1 className="text-3xl font-bold text-foreground">カテゴリー詳細編集</h1>
            </div>

            <div className="bg-surface p-8 rounded-xl border border-border shadow-sm">
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground-muted mb-1">ID</label>
                        <input
                            type="text"
                            value={category?.id || ''}
                            disabled
                            className="w-full bg-surface-muted/50 border border-border rounded px-3 py-2 text-foreground-muted cursor-not-allowed font-mono text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground-muted mb-1">カテゴリー名</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-surface-muted border border-border rounded px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none transition"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground-muted mb-1">スラッグ (Slug)</label>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="w-full bg-surface-muted border border-border rounded px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none transition"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground-muted mb-1">表示順序</label>
                        <input
                            type="number"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                            className="w-full bg-surface-muted border border-border rounded px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none transition"
                            min="0"
                        />
                        <p className="text-xs text-foreground-muted mt-1">
                            数値が小さいほど上位に表示されます（0 = 最優先）
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground-muted mb-1">説明 (Detailed Explanation)</label>
                        <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="w-full bg-surface-muted border border-border rounded px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none transition h-64"
                            placeholder="カテゴリーの詳細な説明をここに記述してください..."
                        />
                        <p className="text-xs text-foreground-muted mt-1">
                            ユーザーに表示されるカテゴリーの詳細な説明文です。詳しく記述することができます。
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-border">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded font-medium transition"
                        >
                            カテゴリーを削除
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-primary hover:bg-primary-hover disabled:bg-primary/70 disabled:cursor-not-allowed text-white rounded font-bold shadow-lg shadow-indigo-500/20 transition transform hover:translate-y-[-1px]"
                        >
                            {saving ? '保存中...' : '変更を保存する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
