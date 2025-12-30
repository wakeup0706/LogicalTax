import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET all users
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
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

// UPDATE user (Edit email, name, is_admin)
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
        const { id, email, full_name, password, is_admin } = body;

        if (!id) throw new Error("User ID is required");

        // Build update object with only provided fields
        const updateData: Record<string, any> = {};
        if (email !== undefined) updateData.email = email;
        if (full_name !== undefined) updateData.full_name = full_name;
        if (is_admin !== undefined) updateData.is_admin = is_admin;
        updateData.updated_at = new Date().toISOString();

        // Update in public.users table
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', id);

        if (dbError) throw dbError;

        // Update Supabase Auth (email and/or password)
        const authUpdate: Record<string, any> = {};
        if (email) authUpdate.email = email;
        if (password) authUpdate.password = password;

        if (Object.keys(authUpdate).length > 0) {
            try {
                await supabaseAdmin.auth.admin.updateUserById(id, authUpdate);
            } catch (authErr: any) {
                console.warn("Auth update failed:", authErr.message);
                // Don't block success if DB update worked
            }
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

// DELETE user
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

        // Delete from public.users table
        // Note: If you want to delete from Auth, you need supabaseAdmin.auth.admin.deleteUser(id)
        // But deleting from public.users is often enough if you have cascading deletes or just want to hide them from app logic
        // For a full cleanup, we try Delete from Auth as well if possible, or just table.

        // Let's try deleting from the DB table first.
        const { error } = await supabaseAdmin.from('users').delete().eq('id', id);

        if (error) throw error;

        // Optionally attempt to delete from Auth (Supabase Auth)
        // This requires the Service Role Key to have permission, usually it does.
        try {
            await supabaseAdmin.auth.admin.deleteUser(id);
        } catch (authErr) {
            console.warn("Auth deletion failed or user already gone:", authErr);
            // We don't block the success response if DB delete worked
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
