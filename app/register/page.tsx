'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Icons
const MailIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const LockIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('パスワードが一致しません');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('パスワードは6文字以上である必要があります');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    fullName,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '登録中にエラーが発生しました');
                setLoading(false);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError('エラーが発生しました');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full mix-blend-multiply filter blur-[128px] opacity-50"></div>
                <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-purple-200/30 rounded-full mix-blend-multiply filter blur-[128px] opacity-50"></div>
                <div className="absolute top-[50%] right-[30%] w-[30%] h-[30%] bg-indigo-200/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
            </div>

            {/* Back to Home */}
            <div className="absolute top-6 left-6 z-20">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-[#444444] hover:text-[#111111] transition-colors group"
                >
                    <ArrowLeftIcon />
                    <span className="text-sm font-medium">ホームに戻る</span>
                </Link>
            </div>

            <div className="z-10 w-full max-w-md">
                {/* Decorative Element */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#2563eb] to-[#1e40af] rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#2563eb] to-[#1e40af] rounded-2xl blur opacity-30"></div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-gray-200 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    {/* Card glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 pointer-events-none"></div>

                    <div className="relative">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-[#111111] mb-3">アカウント作成</h1>
                            <p className="text-[#444444]">LogicalTaxを始めましょう</p>
                        </div>

                        {success ? (
                            <div className="text-center py-8">
                                <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 p-6 rounded-2xl">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-lg">登録が完了しました！</p>
                                    <p className="mt-2 text-emerald-600">ログインページへ移動します...</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl flex items-center gap-3">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-[#444444] mb-2">お名前（任意）</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <UserIcon />
                                        </div>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-gray-100 border border-gray-300 rounded-xl pl-12 pr-4 py-3.5 text-[#111111] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
                                            placeholder="山田 太郎"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#444444] mb-2">メールアドレス</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <MailIcon />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full bg-gray-100 border border-gray-300 rounded-xl pl-12 pr-4 py-3.5 text-[#111111] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#444444] mb-2">パスワード</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <LockIcon />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full bg-gray-100 border border-gray-300 rounded-xl pl-12 pr-12 py-3.5 text-[#111111] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#111111] transition-colors"
                                        >
                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                    <p className="mt-1.5 text-xs text-[#444444]">6文字以上で設定してください</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#444444] mb-2">パスワード（確認）</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <LockIcon />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="w-full bg-gray-100 border border-gray-300 rounded-xl pl-12 pr-12 py-3.5 text-[#111111] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#111111] transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] hover:from-[#1e40af] hover:to-[#1e3a8a] text-white font-semibold shadow-lg shadow-indigo-500/25 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            登録中...
                                        </span>
                                    ) : 'アカウントを作成'}
                                </button>
                            </form>
                        )}

                        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <p className="text-[#444444]">
                                すでにアカウントをお持ちですか？{' '}
                                <Link href="/login" className="text-[#2563eb] hover:text-[#1e40af] font-semibold transition-colors">
                                    ログイン
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
