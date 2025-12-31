import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { email, password, fullName } = await req.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: "メールアドレスとパスワードは必須です" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "パスワードは6文字以上である必要があります" },
                { status: 400 }
            );
        }

        // Create user with Supabase Admin (auto-confirm email)
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: { full_name: fullName || '' },
            email_confirm: true, // Auto confirm so user can login immediately
        });

        if (error) {
            // Handle specific errors
            if (error.message.includes("already been registered") || error.message.includes("already registered")) {
                return NextResponse.json(
                    { error: "このメールアドレスは既に登録されています" },
                    { status: 400 }
                );
            }
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: "登録が完了しました。ログインしてください。",
            user: data.user,
        });
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: error.message || "登録中にエラーが発生しました" },
            { status: 400 }
        );
    }
}
