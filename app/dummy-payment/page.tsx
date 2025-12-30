'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DummyPaymentPage() {
    const router = useRouter();
    const [status, setStatus] = useState('processing');

    useEffect(() => {
        // Simulate payment processing time
        const timer1 = setTimeout(() => {
            setStatus('success');
        }, 2000);

        // Redirect back to app
        const timer2 = setTimeout(() => {
            router.push('/qa?success=true');
        }, 3500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                {status === 'processing' ? (
                    <>
                        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">決済処理中...</h1>
                        <p className="text-gray-500">
                            安全な決済ゲートウェイに接続しています。<br />
                            画面を閉じずにお待ちください。
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">決済が完了しました</h1>
                        <p className="text-gray-500">
                            LogicalTaxに戻ります...
                        </p>
                    </>
                )}
            </div>
            <p className="mt-8 text-sm text-gray-400">
                Mock Payment Gateway &copy; 2024
            </p>
        </div>
    );
}
