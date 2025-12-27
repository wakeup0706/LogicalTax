'use client';

import { signOut } from 'next-auth/react';

export default function UserNav({ user }: { user: { name?: string | null, email?: string | null } }) {
    return (
        <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">{user.name || 'ユーザー'}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
                ログアウト
            </button>
        </div>
    );
}
