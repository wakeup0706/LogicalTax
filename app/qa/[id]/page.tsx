import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function QADetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/login');
    }

    // TODO: Set to false when Stripe is configured with STRIPE_WEBHOOK_SECRET and STRIPE_PRICE_ID
    const BYPASS_SUBSCRIPTION_CHECK = true;

    // 1. Subscription Check (skip if bypass is enabled)
    if (!BYPASS_SUBSCRIPTION_CHECK) {
        const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (!sub) redirect('/checkout');

        let isAccessGranted = false;
        if (sub.status === 'active' || sub.status === 'trialing') {
            isAccessGranted = true;
        } else if (sub.status === 'canceled' && new Date(sub.current_period_end || 0) > new Date()) {
            isAccessGranted = true;
        }

        // Double check stripe if needed
        if (!isAccessGranted) {
            try {
                const stripeSub = await stripe.subscriptions.retrieve(sub.id) as Stripe.Subscription;
                const currentPeriodEnd = stripeSub.items.data[0]?.current_period_end;
                if (stripeSub.status === 'active' || stripeSub.status === 'trialing' ||
                    (stripeSub.status === 'canceled' && currentPeriodEnd && new Date(currentPeriodEnd * 1000) > new Date())) {
                    isAccessGranted = true;
                }
            } catch (e) { }
        }

        if (!isAccessGranted) redirect('/checkout');
    }


    // 2. Fetch Q&A Detail
    const { id } = await params;
    const { data: qa } = await supabaseAdmin
        .from('qa')
        .select('*, categories(name)')
        .eq('id', id)
        .single();

    if (!qa) {
        notFound();
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/qa"
                    className="inline-flex items-center text-[#444444] hover:text-[#2563eb] mb-6 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    質問一覧に戻る
                </Link>

                <article className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#2563eb]">
                                {qa.categories?.name || '一般'}
                            </span>
                            <span className="text-[#444444] text-xs">
                                公開日: {new Date(qa.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#111111] mb-6 leading-tight">
                            {qa.question_title}
                        </h1>

                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h3 className="text-xs font-bold text-[#444444] uppercase tracking-wider mb-2">質問内容</h3>
                            <p className="text-[#444444] whitespace-pre-wrap leading-relaxed">
                                {qa.question_content}
                            </p>
                        </div>
                    </div>

                    {/* Answer Section */}
                    <div className="p-8 bg-gradient-to-b from-gray-50 to-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-[#111111]">専門家の回答</h2>
                        </div>

                        <div className="prose max-w-none prose-lg">
                            <div className="text-[#444444] whitespace-pre-wrap leading-relaxed">
                                {qa.answer_content}
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                            <p className="text-[#444444] text-sm">
                                この回答は役に立ちましたか？
                                <span className="text-[#2563eb] ml-2 cursor-pointer hover:underline">はい</span>
                                <span className="mx-2">/</span>
                                <span className="text-[#2563eb] cursor-pointer hover:underline">いいえ</span>
                            </p>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
}
