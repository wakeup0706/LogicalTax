import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ redirectTo: '/login' });
    }

    // Check Admin Status
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

    if (user?.is_admin) {
        return NextResponse.json({ redirectTo: '/admin' });
    }

    // Check Subscription Status
    const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('status')
        .eq('user_id', session.user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

    if (subscription) {
        return NextResponse.json({ redirectTo: '/qa' });
    } else {
        return NextResponse.json({ redirectTo: '/checkout' });
    }
}
