import { supabaseAdmin } from "@/lib/supabase";

export default async function AdminDashboard() {
    const { count: userCount } = await supabaseAdmin.from("users").select("*", { count: "exact", head: true });
    const { count: qaCount } = await supabaseAdmin.from("qa").select("*", { count: "exact", head: true });
    const { count: catCount } = await supabaseAdmin.from("categories").select("*", { count: "exact", head: true });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8 text-[#111111]">ダッシュボード</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-[#444444] text-sm font-medium mb-1">総ユーザー数</h3>
                    <p className="text-3xl font-bold text-[#2563eb]">{userCount || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-[#444444] text-sm font-medium mb-1">Q&A エントリー数</h3>
                    <p className="text-3xl font-bold text-cyan-600">{qaCount || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-[#444444] text-sm font-medium mb-1">カテゴリー数</h3>
                    <p className="text-3xl font-bold text-purple-600">{catCount || 0}</p>
                </div>
            </div>

            <div className="mt-12 bg-gray-50 p-8 rounded-xl border border-gray-200 text-center">
                <p className="text-[#444444]">
                    サイドバーのオプションを選択してコンテンツを管理してください。
                </p>
            </div>
        </div>
    );
}
