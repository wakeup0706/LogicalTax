'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense, useEffect } from 'react';

function CheckoutContent() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const canceled = searchParams.get('canceled');
    const success = searchParams.get('success');

    // Redirect to login if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?redirect=/checkout');
        }
    }, [status, router]);

    // Handle success (from dummy payment or real Stripe)
    useEffect(() => {
        if (success === 'true' && session) {
            // Show success message and redirect to /qa
            setTimeout(() => {
                router.push('/qa');
            }, 2000);
        }
    }, [success, session, router]);

    const handleSubscribe = async () => {
        if (!session) {
            signIn();
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
            });
            const data = await res.json();
            
            // Check if we're in dummy mode
            if (data.dummyMode) {
                // Simulate payment success immediately
                setTimeout(() => {
                    router.push('/checkout?success=true');
                }, 1000);
            } else if (data.url) {
                // Real Stripe checkout
                window.location.href = data.url;
            } else {
                alert('支払いの開始に失敗しました。もう一度お試しください。');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            alert('エラーが発生しました。もう一度お試しください。');
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // Don't render content if not authenticated (will redirect)
    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-700 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-700 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-700 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-4000"></div>
            </div>

            <div className="z-10 w-full max-w-md">
                {success && (
                    <div className="mb-6 bg-green-500/10 border border-green-500/50 text-green-200 p-4 rounded-lg backdrop-blur-sm text-center">
                        🎉 お支払いが完了しました！Q&Aページにリダイレクトしています...
                    </div>
                )}

                {canceled && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg backdrop-blur-sm">
                        支払いがキャンセルされました。準備ができ次第、再度お試しください。
                    </div>
                )}

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
                            LogicalTax Pro
                        </h1>
                        <p className="text-slate-400">税務判断をサポートする究極のツール。</p>
                    </div>

                    <div className="mb-8">
                        <div className="flex items-baseline justify-center mb-4">
                            <span className="text-5xl font-extrabold text-white">¥10,000</span>
                            <span className="text-xl text-slate-400 ml-2">/月</span>
                        </div>
                        <p className="text-center text-sm text-slate-500">いつでもキャンセル可能。</p>
                    </div>

                    <ul className="space-y-4 mb-8">
                        {['Q&A 無制限アクセス', '専門家による回答', '優先サポート', '日次アップデート'].map((feature) => (
                            <li key={feature} className="flex items-center text-slate-300">
                                <svg className="w-5 h-5 text-indigo-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? '処理中...' : session ? '今すぐ登録する' : 'ログインして登録する'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}

