import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

// This endpoint is called when user returns from Stripe with ?success=true
// It creates a subscription record so user can access Q&A
// Note: In production, this should be handled by webhook for reliability
export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // Check if user already has an active subscription
        const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .single();

        if (existingSub) {
            // Already has subscription, no need to create
            return NextResponse.json({ success: true, message: 'Subscription already exists' });
        }

        // Create a temporary subscription record
        // Note: In production, webhook would create this with real Stripe subscription ID
        const tempSubId = `sub_temp_${Date.now()}`;
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 month from now

        await supabaseAdmin.from('subscriptions').upsert({
            id: tempSubId,
            user_id: session.user.id,
            status: 'active',
            price_id: 'price_temp_pending_webhook',
            cancel_at_period_end: false,
            current_period_end: currentPeriodEnd.toISOString(),
        });

        console.log('✅ Temporary subscription created for user:', session.user.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error confirming payment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
