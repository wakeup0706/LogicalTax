'use client';

import { signOut } from 'next-auth/react';

export default function UserNav({ user }: { user: { name?: string | null, email?: string | null } }) {
    return (
        <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-[#111111]">{user.name || 'ユーザー'}</p>
                <p className="text-xs text-[#444444]">{user.email}</p>
            </div>
            <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-2 text-xs font-medium text-[#444444] hover:text-[#111111] bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
                ログアウト
            </button>
        </div>
    );
}
