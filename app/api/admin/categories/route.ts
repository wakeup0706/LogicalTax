import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET single category by ID
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
        const slug = searchParams.get('slug');

        if (!id && !slug) {
            // Return all categories if no ID or slug specified
            const { data, error } = await supabaseAdmin.from('categories').select('*').order('name');
            if (error) throw error;
            return NextResponse.json({ data });
        }

        // Return single category by ID or slug
        let query = supabaseAdmin.from('categories').select('*');
        
        if (id) {
            query = query.eq('id', id);
        } else if (slug) {
            query = query.eq('slug', slug);
        }

        const { data, error } = await query.single();

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
        const { name, slug, description } = body;

        const { data, error } = await supabaseAdmin.from('categories').insert({
            name,
            slug,
            description
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
        const { id, name, slug, description } = body;

        if (!id) throw new Error("ID required");

        const { data, error } = await supabaseAdmin.from('categories')
            .update({ name, slug, description })
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

        const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
