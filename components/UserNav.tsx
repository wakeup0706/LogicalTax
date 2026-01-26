'use client';

import { signOut } from 'next-auth/react';

export default function UserNav({ user }: { user: { name?: string | null, email?: string | null } }) {
    return (
        <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground">{user.name || 'ユーザー'}</p>
                <p className="text-xs text-foreground-muted">{user.email}</p>
            </div>
            <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-2 text-xs font-medium text-foreground-muted hover:text-foreground bg-surface hover:bg-surface-muted border border-border rounded-lg transition-colors"
            >
                ログアウト
            </button>
        </div>
    );
}
