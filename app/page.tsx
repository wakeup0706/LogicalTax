export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';

export default async function HomePage() {
  // Fetch first 5 Q&A items for preview
  const { data: qaList } = await supabaseAdmin
    .from('qa')
    .select('id, question_title, answer_content, categories(name)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen selection:bg-indigo-500/30">
      {/* Background patterns */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-lg font-semibold tracking-tight text-[#111111]">
            LogicalTax <span className="text-[#444444] font-normal">Q&A</span>
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[#444444] hover:text-[#111111] transition-colors"
            >
              ログイン
            </Link>
            {process.env.NEXT_PUBLIC_ENABLE_REGISTRATION !== 'false' && (
              <Link
                href="/register"
                className="text-sm font-medium px-4 py-2 rounded-full bg-[#2563eb] hover:bg-[#1e40af] !text-white transition-colors"
              >
                新規登録
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-20">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-4 text-center mb-32">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-300 bg-white text-xs text-[#444444] mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            専門家による信頼できる回答
          </div>

          <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight leading-[1.1] text-[#111111]">
            税務判断をサポートする<br />
            <span className="text-[#444444]">究極のQ&Aプラットフォーム</span>
          </h2>

          <p className="text-xl text-[#444444] mb-10 max-w-2xl mx-auto leading-relaxed">
            専門家による詳細な回答で、税務の疑問を即座に解決。<br className="hidden md:block" />
            月額¥10,000で無制限アクセス。
          </p>

          <div className="flex justify-center items-center gap-4">
            {process.env.NEXT_PUBLIC_ENABLE_REGISTRATION !== 'false' && (
              <Link
                href="/register"
                className="px-8 py-4 rounded-full bg-[#2563eb] !text-white text-lg font-medium hover:bg-[#1e40af] transition-colors shadow-lg shadow-indigo-500/20"
              >
                今すぐ登録する
              </Link>
            )}
            <Link
              href="/login"
              className="px-8 py-4 rounded-full border border-gray-300 text-[#444444] text-lg font-medium hover:border-gray-400 hover:text-[#111111] transition-colors"
            >
              ログイン
            </Link>
          </div>
        </div>

        {/* Preview Q&A Section */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12 border-b border-gray-200 pb-4">
            <h3 className="text-2xl font-semibold tracking-tight text-[#111111]">最新の質問</h3>
            <Link
              href="/login"
              className="text-[#2563eb] hover:text-[#1e40af] text-sm font-medium flex items-center gap-1 group"
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
                className="group p-6 rounded-2xl bg-white border border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-[#444444] border border-gray-200">
                    {item.categories?.name}
                  </span>
                </div>

                <h4 className="text-lg font-semibold text-[#111111] mb-3 group-hover:text-[#2563eb] transition-colors">
                  {item.question_title}
                </h4>

                <div className="prose prose-sm max-w-none text-[#444444]">
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
          <div className="rounded-3xl border border-gray-300 bg-white p-12 text-center relative overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

            <h3 className="text-3xl font-bold mb-4 relative z-10 text-[#111111]">今すぐ始めましょう</h3>
            <p className="text-lg text-[#444444] mb-8 relative z-10">
              月額¥10,000で全てのQ&Aに無制限アクセス
            </p>
            <Link
              href="/login"
              className="relative z-10 inline-block px-8 py-3 rounded-full bg-[#2563eb] !text-white font-medium hover:bg-[#1e40af] transition-colors"
            >
              アカウントを作成
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
