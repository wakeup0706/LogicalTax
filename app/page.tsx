export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';

export default async function HomePage() {
  // Fetch featured 'Free to View' Q&A items, or fall back to just latest if none special
  // Per requirement: "First, the first screen should display about 5 Q&As pointed out by the administrator."
  // which maps to is_free = true
  const { data: qaList } = await supabaseAdmin
    .from('qa')
    .select('id, question_title, answer_content, categories(name), is_free')
    .eq('is_published', true)
    .eq('is_free', true)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      {/* Background patterns */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-lg font-semibold tracking-tight text-white">
            LogicalTax <span className="text-zinc-400 font-normal">Q&A</span>
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              ログイン
            </Link>

          </div>
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-20">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-4 text-center mb-32">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            専門家による信頼できる回答
          </div>

          <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight leading-[1.1]">
            税務判断をサポートする<br />
            <span className="text-zinc-400">究極のQ&Aプラットフォーム</span>
          </h2>

          <p className="text-xl text-zinc-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            専門家による詳細な回答で、税務の疑問を即座に解決。<br className="hidden md:block" />
            月額¥10,000で無制限アクセス。
          </p>

          <div className="flex justify-center items-center gap-4">
            <Link
              href="/login"
              className="px-8 py-4 rounded-full bg-white text-zinc-950 text-lg font-medium hover:bg-zinc-200 transition-colors shadow-xl shadow-white/5"
            >
              今すぐ登録する
            </Link>
          </div>
        </div>

        {/* Preview Q&A Section */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12 border-b border-zinc-800 pb-4">
            <h3 className="text-2xl font-semibold tracking-tight">注目の質問 (無料公開中)</h3>
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 group"
            >
              全ての質問を見る
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="space-y-6">
            {qaList?.map((item: any) => (
              <div
                key={item.id}
                className="group p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                    {item.categories?.name}
                  </span>
                  {item.is_free && (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-900/30 text-emerald-400 border border-emerald-500/30">
                      FREE
                    </span>
                  )}
                </div>

                <h4 className="text-lg font-semibold text-white mb-3 group-hover:text-indigo-400 transition-colors">
                  {item.question_title}
                </h4>

                <div className="prose prose-invert prose-sm max-w-none text-zinc-400">
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {item.answer_content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 mt-32">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

            <h3 className="text-3xl font-bold mb-4 relative z-10">今すぐ始めましょう</h3>
            <p className="text-lg text-zinc-400 mb-8 relative z-10">
              月額¥10,000で全てのQ&Aに無制限アクセス
            </p>
            <Link
              href="/login"
              className="relative z-10 inline-block px-8 py-3 rounded-full bg-white text-zinc-950 font-medium hover:bg-zinc-200 transition-colors"
            >
              アカウントを作成
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
