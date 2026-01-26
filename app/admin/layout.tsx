import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import UserNav from "@/components/UserNav";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    // Verify Admin Status
    const { data: user } = await supabaseAdmin
        .from("users")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

    if (!user || !user.is_admin) {
        redirect("/qa"); // specific redirection for non-admins
    }

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-surface border-r border-border flex flex-col">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-hover">
                        管理パネル
                    </h2>
                </div>
                <nav className="p-4 space-y-2 flex-1">
                    <Link href="/admin" className="block px-4 py-2 rounded text-foreground-muted hover:bg-surface-muted hover:text-foreground transition">
                        ダッシュボード
                    </Link>
                    <Link href="/admin/qa" className="block px-4 py-2 rounded text-foreground-muted hover:bg-surface-muted hover:text-foreground transition">
                        Q&A管理
                    </Link>
                    <Link href="/admin/categories" className="block px-4 py-2 rounded text-foreground-muted hover:bg-surface-muted hover:text-foreground transition">
                        カテゴリー管理
                    </Link>
                    <Link href="/admin/users" className="block px-4 py-2 rounded text-foreground-muted hover:bg-surface-muted hover:text-foreground transition">
                        ユーザー管理
                    </Link>
                </nav>
                <div className="p-4 mt-auto border-t border-border space-y-4">
                    <Link href="/" className="block text-sm text-foreground-muted hover:text-foreground">
                        ← アプリに戻る
                    </Link>
                    <UserNav user={{ name: session.user.name, email: session.user.email }} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
