import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import Link from 'next/link';
import UserNav from '@/components/UserNav';
import { Category } from '@/types/database';
import QAListClient from './QAListClient';

export const dynamic = 'force-dynamic';

export default async function QAPage(props: { searchParams: Promise<{ cat?: string; q?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/login');
    }

    // TODO: Set to false when Stripe is configured with STRIPE_WEBHOOK_SECRET and STRIPE_PRICE_ID
    const BYPASS_SUBSCRIPTION_CHECK = false;

    // 0. Check if Admin
    const { data: userData } = await supabaseAdmin
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

    if (!userData?.is_admin && !BYPASS_SUBSCRIPTION_CHECK) {
        // 1. Subscription Check (Only for non-admins)
        const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (!sub) {
            redirect('/checkout');
        }

        let isAccessGranted = false;
        const now = new Date();

        // Check DB Status
        if (sub.status === 'active' || sub.status === 'trialing') {
            isAccessGranted = true;
        } else if (sub.status === 'canceled') {
            const periodEnd = new Date(sub.current_period_end || 0);
            if (periodEnd > now) {
                isAccessGranted = true;
            }
        }

        // Fallback: Check Stripe if DB says inactive
        if (!isAccessGranted) {
            try {
                const stripeSub: any = await stripe.subscriptions.retrieve(sub.id);
                const stripePeriodEnd = new Date(stripeSub.current_period_end * 1000);

                const isStripeActive = stripeSub.status === 'active' || stripeSub.status === 'trialing';
                const isStripeCanceledButActive = stripeSub.status === 'canceled' && stripePeriodEnd > now;

                if (isStripeActive || isStripeCanceledButActive) {
                    isAccessGranted = true;
                }
            } catch (e) {
                // Ignore stripe errors
            }
        }

        if (!isAccessGranted) {
            redirect('/checkout');
        }
    }

    // 2. Fetch Data
    const { cat, q } = searchParams;

    // Fetch Categories
    const { data: categories } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('sort_order') as { data: Category[] | null };

    // Fetch Q&A - with optional search
    let qaQuery = supabaseAdmin
        .from('qa')
        .select('id, question_title, question_content, answer_content, category_id, is_published, is_free, sort_order, categories(name)')
        .eq('is_published', true);

    if (cat) {
        qaQuery = qaQuery.eq('category_id', cat);
    }

    // Add search filter if query present
    if (q && q.trim().length >= 2) {
        qaQuery = qaQuery.or(`question_title.ilike.%${q}%,question_content.ilike.%${q}%,answer_content.ilike.%${q}%`);
    }

    qaQuery = qaQuery.order('sort_order', { ascending: true }).order('created_at', { ascending: false });

    const { data: qaList } = await qaQuery;

    // 3. Render
    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-surface/80 backdrop-blur-xl border-b border-border p-4 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/qa" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="text-white font-bold text-lg">L</span>
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-hover">
                            LogicalTax Q&A
                        </h1>
                    </Link>
                    <div className="flex items-center gap-4">
                        {userData?.is_admin && (
                            <Link
                                href="/admin"
                                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover !text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/20"
                            >
                                管理画面へ
                            </Link>
                        )}
                        <UserNav user={{ name: session.user.name, email: session.user.email }} />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
                {/* Sidebar: Categories */}
                <aside className="w-full lg:w-72 flex-shrink-0">
                    <div className="lg:sticky lg:top-24">
                        <h3 className="text-sm font-bold text-foreground-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            カテゴリー
                        </h3>
                        <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                            <Link
                                href="/qa"
                                className={`px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${!cat
                                    ? 'bg-primary !text-white border-transparent shadow-lg shadow-indigo-500/20'
                                    : 'bg-surface text-foreground-muted hover:bg-surface-muted border-border hover:border-gray-300'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-lg">📋</span>
                                    すべての質問
                                </span>
                            </Link>
                            {categories?.map((c, idx) => {
                                const icons = ['💰', '📊', '🏢', '📝', '⚖️', '💼', '📈', '🔍'];
                                return (
                                    <Link
                                        key={c.id}
                                        href={`/qa?cat=${c.id}`}
                                        className={`px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${cat === c.id
                                            ? 'bg-primary !text-white border-transparent shadow-lg shadow-indigo-500/20'
                                            : 'bg-surface text-foreground-muted hover:bg-surface-muted border-border hover:border-gray-300'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="text-lg">{icons[idx % icons.length]}</span>
                                            {c.name}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Pass to client component for interactive search */}
                    <QAListClient
                        key={cat || 'all'}
                        initialQAList={qaList || []}
                        categories={categories || []}
                        currentCategory={cat || null}
                        initialQuery={q || ''}
                        isAdmin={userData?.is_admin || false}
                    />
                </main>
            </div>
        </div>
    );
}
