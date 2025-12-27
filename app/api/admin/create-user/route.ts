import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Double check admin status
    const { data: adminUser } = await supabaseAdmin
        .from("users")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

    if (!adminUser?.is_admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { email, password, fullName } = await req.json();

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: { full_name: fullName },
            email_confirm: true, // Auto confirm for MVP
        });

        if (error) throw error;

        return NextResponse.json({ user: data.user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
