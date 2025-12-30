import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Admin
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

    if (!user?.is_admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const { data, error } = await supabaseAdmin
                .from("qa")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return NextResponse.json({ data });
        }

        const { data, error } = await supabaseAdmin
            .from("qa")
            .select("*, categories(name)")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Admin
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

    if (!user?.is_admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, question, answer, category_id, is_free } = body;

        // Force only 5 free questions max
        if (is_free) {
            const { count, error: countError } = await supabaseAdmin
                .from('qa')
                .select('*', { count: 'exact', head: true })
                .eq('is_free', true);

            if (countError) throw countError;

            if ((count || 0) >= 5) {
                return NextResponse.json({
                    error: "無料公開枠の上限(5件)に達しています。既存の無料Q&Aを解除してください。"
                }, { status: 400 });
            }
        }

        const { data, error } = await supabaseAdmin.from('qa').insert({
            question_title: title,
            question_content: question,
            answer_content: answer,
            category_id,
            is_published: true,
            is_free: is_free || false
        }).select().single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Admin
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

    if (!user?.is_admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, title, question, answer, category_id, is_published, is_free } = body;

        if (!id) throw new Error("ID required");

        // Force only 5 free questions max
        if (is_free) {
            const { count, error: countError } = await supabaseAdmin
                .from('qa')
                .select('*', { count: 'exact', head: true })
                .eq('is_free', true)
                .neq('id', id); // Exclude self

            if (countError) throw countError;

            if ((count || 0) >= 5) {
                return NextResponse.json({
                    error: "無料公開枠の上限(5件)に達しています。既存の無料Q&Aを解除してください。"
                }, { status: 400 });
            }
        }

        const { data, error } = await supabaseAdmin.from('qa')
            .update({
                question_title: title,
                question_content: question,
                answer_content: answer,
                category_id,
                is_published,
                is_free
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Admin
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

    if (!user?.is_admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) throw new Error("ID required");

        const { error } = await supabaseAdmin.from('qa').delete().eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
