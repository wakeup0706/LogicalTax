'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category } from '@/types/database';

interface QAItem {
    id: string;
    question_title: string;
    question_content?: string;
    answer_content: string;
    category_id: string | null;
    is_published: boolean;
    is_free: boolean;
    sort_order?: number;
    categories?: { name: string } | null;
}

interface Props {
    initialQAList: QAItem[];
    categories: Category[];
    currentCategory: string | null;
    initialQuery: string;
    isAdmin: boolean;
}

type SortOption = 'default' | 'title_asc' | 'title_desc' | 'category' | 'free_first';

export default function QAListClient({ initialQAList, categories, currentCategory, initialQuery, isAdmin }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [qaList, setQaList] = useState(initialQAList);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(!!initialQuery);
    const [sortOption, setSortOption] = useState<SortOption>('default');

    // Sort the list based on selected option
    const sortedQaList = useMemo(() => {
        const list = [...qaList];
        
        // Helper function for case-insensitive, locale-aware sorting
        const compareStrings = (a: string, b: string) => {
            return a.toLowerCase().localeCompare(b.toLowerCase(), undefined, { 
                numeric: true, 
                sensitivity: 'base' 
            });
        };
        
        switch (sortOption) {
            case 'title_asc':
                return list.sort((a, b) => compareStrings(a.question_title, b.question_title));
            case 'title_desc':
                return list.sort((a, b) => compareStrings(b.question_title, a.question_title));
            case 'category':
                return list.sort((a, b) => {
                    const catA = a.categories?.name || 'zzz';
                    const catB = b.categories?.name || 'zzz';
                    return compareStrings(catA, catB);
                });
            case 'free_first':
                return list.sort((a, b) => {
                    if (a.is_free === b.is_free) return 0;
                    return a.is_free ? -1 : 1;
                });
            default:
                return list; // Keep original sort_order
        }
    }, [qaList, sortOption]);

    // Update qaList when initialQAList changes (category filter)
    useEffect(() => {
        setQaList(initialQAList);
        setSearchQuery('');
        setHasSearched(false);
        setSortOption('default');
    }, [initialQAList, currentCategory]);

    // Debounced search
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            if (searchQuery.trim().length === 0 && hasSearched) {
                setQaList(initialQAList);
                setHasSearched(false);
            }
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const params = new URLSearchParams();
                params.set('q', searchQuery);
                if (currentCategory) {
                    params.set('cat', currentCategory);
                }
                
                const res = await fetch(`/api/search?${params.toString()}`);
                const data = await res.json();
                
                if (data.data) {
                    setQaList(data.data);
                    setHasSearched(true);
                }
            } catch (e) {
                console.error('Search error:', e);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, currentCategory, initialQAList, hasSearched]);

    // Highlight search terms in text
    const highlightText = useCallback((text: string, query: string) => {
        if (!query.trim() || query.length < 2) return text;
        
        const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
        return parts.map((part, i) => 
            part.toLowerCase() === query.toLowerCase() 
                ? <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">{part}</mark>
                : part
        );
    }, []);

    const getCategoryName = (item: QAItem) => {
        return item.categories?.name || '一般';
    };

    return (
        <div>
            {/* Title & Search Bar */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <span className="text-3xl">
                            {currentCategory 
                                ? categories.find(c => c.id === currentCategory)?.name 
                                : '最新の質問'}
                        </span>
                        {qaList.length > 0 && (
                            <span className="text-sm font-normal text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">
                                {qaList.length}件
                            </span>
                        )}
                    </h2>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        {isSearching ? (
                            <svg className="animate-spin h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="質問を検索... (キーワードを入力)"
                        className="w-full pl-12 pr-4 py-4 bg-slate-800/70 backdrop-blur border-2 border-slate-700/50 focus:border-emerald-500/50 rounded-2xl text-white placeholder-slate-400 outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 text-lg"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setQaList(initialQAList);
                                setHasSearched(false);
                            }}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {hasSearched && (
                    <p className="text-sm text-slate-400 mt-3 flex items-center gap-2">
                        <span className="text-emerald-400">✓</span>
                        「{searchQuery}」で {qaList.length}件の結果
                    </p>
                )}

                {/* Sort Controls */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-400 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        並び替え:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setSortOption('default')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                sortOption === 'default'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                    : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                            }`}
                        >
                            デフォルト
                        </button>
                        <button
                            onClick={() => setSortOption('title_asc')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                sortOption === 'title_asc'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                    : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                            }`}
                        >
                            タイトル A→Z
                        </button>
                        <button
                            onClick={() => setSortOption('title_desc')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                sortOption === 'title_desc'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                    : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                            }`}
                        >
                            タイトル Z→A
                        </button>
                        <button
                            onClick={() => setSortOption('category')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                sortOption === 'category'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                    : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                            }`}
                        >
                            カテゴリー順
                        </button>
                        <button
                            onClick={() => setSortOption('free_first')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                sortOption === 'free_first'
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                    : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                            }`}
                        >
                            🆓 無料を先に
                        </button>
                    </div>
                </div>
            </div>

            {/* Q&A List */}
            <div className="space-y-4">
                {sortedQaList.map((item, index) => (
                    <Link href={`/qa/${item.id}`} key={item.id} className="block group">
                        <div className="relative bg-slate-800/40 hover:bg-slate-800/70 backdrop-blur border-2 border-slate-700/50 hover:border-emerald-500/30 p-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-emerald-500/5">
                            {/* Status Indicator - Admin Only */}
                            {isAdmin && (
                                <div className="absolute -top-2 -right-2 z-10">
                                    {item.is_published ? (
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center" title="公開中">
                                            <span className="text-emerald-400 text-sm">⭕</span>
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center" title="非公開">
                                            <span className="text-red-400 text-sm">❌</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Number Badge */}
                            <div className="absolute -left-3 -top-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                    {index + 1}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-3 ml-4">
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-700/80 text-cyan-300 border border-cyan-500/20">
                                    {getCategoryName(item)}
                                </span>
                                {item.is_free && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
                                        🆓 無料
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors leading-relaxed ml-4">
                                {hasSearched ? highlightText(item.question_title, searchQuery) : item.question_title}
                            </h3>

                            {/* Answer Preview */}
                            <p className="text-slate-400 line-clamp-2 text-sm leading-relaxed ml-4">
                                {hasSearched ? highlightText(item.answer_content.slice(0, 150), searchQuery) : item.answer_content.slice(0, 150)}...
                            </p>

                            {/* Arrow indicator */}
                            <div className="absolute right-6 bottom-6 text-slate-600 group-hover:text-emerald-400 transition-all group-hover:translate-x-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                ))}

                {qaList.length === 0 && (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-slate-400 text-lg">
                            {hasSearched 
                                ? `「${searchQuery}」に一致する質問が見つかりませんでした`
                                : 'このカテゴリーにはまだ質問がありません'
                            }
                        </p>
                        {hasSearched && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setQaList(initialQAList);
                                    setHasSearched(false);
                                }}
                                className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-medium transition"
                            >
                                検索をクリア
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

