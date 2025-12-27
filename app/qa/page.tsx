import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import Link from 'next/link';
import UserNav from '@/components/UserNav';
import { Category } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function QAPage(props: { searchParams: Promise<{ cat?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/login');
    }

    // 0. Check if Admin
    const { data: userData } = await supabaseAdmin
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

    if (!userData?.is_admin) {
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
                // Ensure we get the subscription object with expanded properties if needed
                const stripeSub: any = await stripe.subscriptions.retrieve(sub.id);

                // Stripe SDK returns 'current_period_end' as a number (Unix timestamp in seconds)
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
    const { cat } = searchParams;

    // Fetch Categories
    const { data: categories } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('sort_order') as { data: Category[] | null };

    // Fetch Q&A
    let qaQuery = supabaseAdmin
        .from('qa')
        .select('id, question_title, answer_content, category_id, is_published, categories(name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (cat) {
        qaQuery = qaQuery.eq('category_id', cat);
    }

    const { data: qaList } = await qaQuery;

    // 3. Render
    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                        LogicalTax Q&A
                    </h1>
                    <div className="flex items-center gap-4">
                        {userData?.is_admin && (
                            <Link
                                href="/admin"
                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                            >
                                管理画面へ
                            </Link>
                        )}
                        <UserNav user={{ name: session.user.name, email: session.user.email }} />
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
                {/* Sidebar: Categories */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">カテゴリー</h3>
                    <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        <Link
                            href="/qa"
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${!cat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                            すべての質問
                        </Link>
                        {categories?.map((c) => (
                            <Link
                                key={c.id}
                                href={`/qa?cat=${c.id}`}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${cat === c.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                            >
                                {c.name}
                            </Link>
                        ))}
                    </div>
                </aside>

                {/* Main Content: Q&A List */}
                <main className="flex-1">
                    <h2 className="text-2xl font-bold mb-6">
                        {cat ? categories?.find(c => c.id === cat)?.name : '最新の質問'}
                    </h2>

                    <div className="space-y-4">
                        {qaList?.map((item: any) => (
                            <Link href={`/qa/${item.id}`} key={item.id} className="block group">
                                <div className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 p-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2 py-1 rounded text-xs font-bold bg-slate-700 text-indigo-300">
                                            {item.categories?.name}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                                        {item.question_title}
                                    </h3>
                                    <p className="text-slate-400 line-clamp-2 text-sm">
                                        {item.answer_content}
                                    </p>
                                </div>
                            </Link>
                        ))}

                        {qaList?.length === 0 && (
                            <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                                <p className="text-slate-500">このカテゴリーにはまだ質問がありません。</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
